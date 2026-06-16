import {
  HEROES,
  LARGE_BOSS_POOL,
  MAP_CONFIG,
  TRAITS,
  getEnemyBlueprint,
  getStarterDeck,
  pickLargeBoss,
} from "../data/content.js";

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function rng() {
  return Math.random();
}

function nextId(prefix) {
  return `${prefix}-${Math.floor(rng() * 1e9).toString(36)}`;
}

function pickRandom(array) {
  return array[Math.floor(rng() * array.length)];
}

function pickInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function makeLayerMeta(layerIndex, finalBossId) {
  const layers = [
    {
      id: "stomach",
      name: "胃",
      subtitle: "酸雾前庭",
      accent: "#a4d566",
      surface: "#4a211e",
      bossName: "幽门门槛",
      bossNote: "括约肌决定谁能滚进下一段肠道。",
    },
    {
      id: "small-intestine",
      name: "小肠",
      subtitle: "绒毛走廊",
      accent: "#80c0ff",
      surface: "#5a2e28",
      bossName: "刷状缘关口",
      bossNote: "这里的组织已经学会自己动手榨干你。",
    },
    {
      id: "large-intestine",
      name: "大肠",
      subtitle: "发酵后场",
      accent: "#d96f86",
      surface: "#40292a",
      bossName: "终端堵点",
      bossNote: "这里的关底每次都不一样，但都很不体面。",
    },
  ];
  const meta = layers[layerIndex];
  return {
    ...meta,
    finalBossId: layerIndex === 2 ? finalBossId : null,
  };
}

export function generateLayerNodes(layerIndex) {
  const [minNodes, maxNodes] = MAP_CONFIG.layerNodeCountRange;
  const nodeCount = pickInt(minNodes, maxNodes);
  const maxBranch = MAP_CONFIG.maxBranchByLayer[layerIndex];

  // 中间列数：保证中间节点能放下，同时不超过 maxBranch 的列宽
  const middleNodes = nodeCount - 2;
  const middleColumns = Math.max(1, Math.ceil(middleNodes / maxBranch));
  const totalColumns = middleColumns + 2;

  // 分配每列节点数：首列 1，尾列 1，中间每列至少 1、至多 maxBranch，总和为 nodeCount
  const columnCounts = [1];
  let remaining = middleNodes;
  for (let c = 0; c < middleColumns; c += 1) {
    const columnsLeft = middleColumns - c - 1;
    const maxHere = Math.min(maxBranch, remaining - columnsLeft);
    const count = Math.max(1, maxHere);
    columnCounts.push(count);
    remaining -= count;
  }

  // 兜底：若还有剩余，说明计算有误，均匀塞进中间列（不应发生）
  let safety = 0;
  while (remaining > 0 && safety < 100) {
    for (let c = 1; c < columnCounts.length; c += 1) {
      if (remaining <= 0) break;
      if (columnCounts[c] < maxBranch) {
        columnCounts[c] += 1;
        remaining -= 1;
      }
    }
    safety += 1;
  }
  columnCounts.push(1);

  // 生成节点
  let nodeIndex = 0;
  const columns = [];
  for (let c = 0; c < totalColumns; c += 1) {
    const count = columnCounts[c];
    const column = [];
    for (let i = 0; i < count; i += 1) {
      let type;
      if (c === 0) type = "combat";
      else if (c === totalColumns - 1) type = "boss";
      else type = pickRandom(MAP_CONFIG.middleNodeTypes);

      const x = 0.06 + (c / (totalColumns - 1)) * 0.88;
      const yBase = count === 1 ? 0.5 : (i + 1) / (count + 1);
      const jitter = (rng() - 0.5) * 0.08;
      const y = Math.max(0.12, Math.min(0.88, yBase + jitter));

      column.push({
        id: `layer${layerIndex}-node${nodeIndex}`,
        layerIndex,
        index: nodeIndex,
        type,
        x,
        y,
        unlocked: false,
        cleared: false,
        nextIds: [],
        prevIds: [],
      });
      nodeIndex += 1;
    }
    columns.push(column);
  }

  // 首节点默认解锁
  columns[0][0].unlocked = true;

  // 连接边：前一列每个节点连向后一列至少一个节点，后一列每个节点至少有一个入边
  for (let c = 0; c < totalColumns - 1; c += 1) {
    const fromColumn = columns[c];
    const toColumn = columns[c + 1];

    // 先保证后一列每个节点都有人连过来
    const shuffledFrom = shuffleArray([...fromColumn]);
    toColumn.forEach((toNode, i) => {
      const fromNode = shuffledFrom[i % shuffledFrom.length];
      fromNode.nextIds.push(toNode.id);
      toNode.prevIds.push(fromNode.id);
    });

    // 前一列剩余未出边的节点随机连一条
    fromColumn.forEach((fromNode) => {
      if (!fromNode.nextIds.length) {
        const toNode = pickRandom(toColumn);
        if (!fromNode.nextIds.includes(toNode.id)) {
          fromNode.nextIds.push(toNode.id);
          toNode.prevIds.push(fromNode.id);
        }
      }
    });

    // 随机额外分叉，但不超过 maxBranch 条出边
    fromColumn.forEach((fromNode) => {
      while (fromNode.nextIds.length < maxBranch && rng() < 0.35) {
        const toNode = pickRandom(toColumn);
        if (!fromNode.nextIds.includes(toNode.id)) {
          fromNode.nextIds.push(toNode.id);
          toNode.prevIds.push(fromNode.id);
        } else {
          break;
        }
      }
    });
  }

  // 扁平化为节点数组
  return columns.flat();
}

function getEnemyIdsForNode(node, layerMeta) {
  if (node.type === "boss") {
    if (node.layerIndex === 2) {
      return [layerMeta.finalBossId];
    }
    return [MAP_CONFIG.layerBossIds[node.layerIndex]];
  }
  if (node.type === "elite") {
    const pool = MAP_CONFIG.elitePools[node.layerIndex];
    const count = pickInt(1, 2);
    return Array.from({ length: count }, () => pickRandom(pool));
  }
  const pool = MAP_CONFIG.normalPools[node.layerIndex];
  const count = node.layerIndex === 0 ? pickInt(1, 2) : pickInt(1, 2);
  return Array.from({ length: count }, () => pickRandom(pool));
}

export function makeEncounterFromNode(node, layerMeta) {
  const enemyIds = getEnemyIdsForNode(node, layerMeta);
  const isBoss = node.type === "boss";
  return {
    id: node.id,
    name: isBoss
      ? layerMeta.bossName
      : `${MAP_CONFIG.nodeTypeNames[node.type]} · ${node.id.split("-")[1]}`,
    note: isBoss
      ? layerMeta.bossNote
      : `节点类型：${MAP_CONFIG.nodeTypeNames[node.type]}。`,
    enemyIds,
    boss: isBoss,
  };
}

function makePlayer(classId, buildId) {
  const hero = HEROES[classId];
  return {
    classId,
    buildId,
    name: hero.name,
    maxHp: hero.maxHp,
    hp: hero.maxHp,
    maxEnergy: hero.energy,
    energy: hero.energy,
    block: 0,
    deck: [],
    discard: [],
    hand: [],
    minis: [],
    deadMinis: 0,
    currentTraitId: null,
    focusChain: 0,
    lastAbsorbedTraitId: null,
    traits: [],
    status: {
      bodyguardHits: 0,
      retaliate: 0,
      decoyReady: 0,
    },
  };
}

export function createRunState({ classId = "enoki", buildId = null } = {}) {
  const hero = HEROES[classId];
  const finalBossId = pickLargeBoss(rng());
  const layers = [0, 1, 2].map((layerIndex) => {
    const meta = makeLayerMeta(layerIndex, finalBossId);
    const nodes = generateLayerNodes(layerIndex);
    return {
      ...meta,
      layerIndex,
      nodes,
    };
  });

  const state = {
    title: "The Indigestibles",
    classId,
    buildId,
    hero,
    finalBossId,
    layers,
    layerIndex: 0,
    currentNodeId: layers[0].nodes[0].id,
    currentEncounter: null,
    phase: "player",
    turn: 1,
    log: [],
    player: makePlayer(classId, buildId),
    enemies: [],
  };

  return state;
}

export function getCurrentLayer(state) {
  return state.layers[state.layerIndex];
}

export function getCurrentNode(state) {
  return getCurrentLayer(state).nodes.find((node) => node.id === state.currentNodeId);
}

export function findNodeById(state, nodeId) {
  for (const layer of state.layers) {
    const node = layer.nodes.find((n) => n.id === nodeId);
    if (node) return { layer, node };
  }
  return null;
}

export function isBossNode(node) {
  return node.type === "boss";
}

export function isFinalBossNode(state, node) {
  return isBossNode(node) && node.layerIndex === state.layers.length - 1;
}

export function unlockNextNodes(state, nodeId) {
  const next = findNodeById(state, nodeId);
  if (!next) return state;
  const { node } = next;
  node.nextIds.forEach((nextId) => {
    const target = findNodeById(state, nextId);
    if (target) target.node.unlocked = true;
  });
  return state;
}

export function markNodeCleared(state, nodeId) {
  const found = findNodeById(state, nodeId);
  if (found) found.node.cleared = true;
  return state;
}

export function advanceToLayer(state, layerIndex) {
  state.layerIndex = layerIndex;
  const layer = state.layers[layerIndex];
  state.currentNodeId = layer.nodes[0].id;
  // 重置该层首节点解锁
  layer.nodes.forEach((node) => {
    node.unlocked = node.id === layer.nodes[0].id;
    node.cleared = false;
  });
  return state;
}

export function restAtCampfire(state) {
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
  return state;
}

export { HEROES, TRAITS };
