import {
  HEROES,
  LARGE_BOSS_POOL,
  MAP_CONFIG,
  TRAITS,
  RELICS,
  GLYCOGEN_REWARDS,
  CARD_RARITY_PRICE,
  RELIC_RARITY_PRICE,
  REWARD_CARD_POOL,
  STARTER_DECKS,
  getCardDefinition,
  getEnemyBlueprint,
  getStarterDeck,
  pickLargeBoss,
  pickRewardCards,
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

function getThreatBudget(node) {
  return node.threatBudget ?? 2;
}

function buildThreatEncounter(pool, budget) {
  const candidates = pool
    .map((id) => getEnemyBlueprint(id))
    .filter((enemy) => enemy?.threat)
    .sort((a, b) => a.threat - b.threat || a.maxHp - b.maxHp);

  const exactMatches = [];
  let bestUnderBudget = null;
  const maxEnemies = 4;

  function rememberUnderBudget(totalThreat, picked) {
    if (totalThreat <= budget && picked.length && (!bestUnderBudget || totalThreat > bestUnderBudget.totalThreat)) {
      bestUnderBudget = { ids: [...picked], totalThreat };
    }
  }

  function search(startIndex, totalThreat, picked) {
    rememberUnderBudget(totalThreat, picked);
    if (totalThreat === budget) {
      exactMatches.push([...picked]);
      return;
    }
    if (totalThreat > budget || picked.length >= maxEnemies) {
      return;
    }

    for (let i = startIndex; i < candidates.length; i += 1) {
      picked.push(candidates[i].id);
      search(i, totalThreat + candidates[i].threat, picked);
      picked.pop();
    }
  }

  search(0, 0, []);
  if (exactMatches.length) return pickRandom(exactMatches);
  if (bestUnderBudget?.ids?.length) return bestUnderBudget.ids;
  return [candidates[0]?.id].filter(Boolean);
}

function assignThreatBudgets(layers) {
  let layerBaseThreat = 2;
  layers.forEach((layer) => {
    const nonBossColumns = [...new Set(layer.nodes.filter((node) => node.type !== "boss").map((node) => node.columnIndex))]
      .sort((a, b) => a - b);

    layer.nodes.forEach((node) => {
      if (node.type === "boss") {
        node.threatBudget = null;
        return;
      }
      const columnOffset = nonBossColumns.indexOf(node.columnIndex);
      node.threatBudget = layerBaseThreat + columnOffset + (node.type === "elite" ? 2 : 0);
    });

    layerBaseThreat += nonBossColumns.length + 1;
  });
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
  // 规则：同一列的中间节点类型互不相同，确保任意分叉的两个子节点 B、C 类型不同
  let nodeIndex = 0;
  const columns = [];
  for (let c = 0; c < totalColumns; c += 1) {
    const count = columnCounts[c];
    const column = [];
    const middleTypePool =
      c === 0 || c === totalColumns - 1
        ? []
        : shuffleArray([...MAP_CONFIG.middleNodeTypes]);
    for (let i = 0; i < count; i += 1) {
      let type;
      if (c === 0) type = "combat";
      else if (c === totalColumns - 1) type = "boss";
      else type = middleTypePool.pop() || pickRandom(MAP_CONFIG.middleNodeTypes);

      const x = 0.06 + (c / (totalColumns - 1)) * 0.88;
      const yBase = count === 1 ? 0.5 : (i + 1) / (count + 1);
      const jitter = (rng() - 0.5) * 0.08;
      const y = Math.max(0.12, Math.min(0.88, yBase + jitter));

      column.push({
        id: `layer${layerIndex}-node${nodeIndex}`,
        layerIndex,
        index: nodeIndex,
        columnIndex: c,
        type,
        x,
        y,
        threatBudget: null,
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
  const pool =
    node.type === "elite"
      ? MAP_CONFIG.elitePools[node.layerIndex]
      : MAP_CONFIG.normalPools[node.layerIndex];
  return buildThreatEncounter(pool, getThreatBudget(node));
}

export function makeEncounterFromNode(node, layerMeta) {
  const enemyIds = getEnemyIdsForNode(node, layerMeta);
  const isBoss = node.type === "boss";
  const threatBudget = isBoss ? null : getThreatBudget(node);
  return {
    id: node.id,
    name: isBoss
      ? layerMeta.bossName
      : `${MAP_CONFIG.nodeTypeNames[node.type]} · ${node.id.split("-")[1]}`,
    note: isBoss
      ? layerMeta.bossNote
      : `节点类型：${MAP_CONFIG.nodeTypeNames[node.type]}，威胁分 ${threatBudget}。`,
    enemyIds,
    boss: isBoss,
    threatBudget,
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
    glycogen: 0,
    relics: [],
    deckKeys: [...STARTER_DECKS[classId]],
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
  assignThreatBudgets(layers);

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
    currentShop: null,
    rewardPending: null,
    mapLinkMode: false,
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

export function generateShopInventory(layerIndex, seed = Math.random()) {
  const cardKeys = [...REWARD_CARD_POOL];
  const relicIds = Object.keys(RELICS);
  const random = (s) => {
    const x = Math.sin(seed + s) * 10000;
    return x - Math.floor(x);
  };

  const cards = Array.from({ length: 4 }, (_, i) => {
    const idx = Math.floor(random(i * 7) * cardKeys.length);
    const key = cardKeys[idx];
    const card = { ...getCardDefinition(key), instanceId: `shop-${key}-${Math.floor(random(i * 13) * 1e9)}` };
    return {
      card,
      price: CARD_RARITY_PRICE[card.rarity || "common"] ?? CARD_RARITY_PRICE.common,
      sold: false,
    };
  });

  const relics = Array.from({ length: 3 }, (_, i) => {
    const idx = Math.floor(random(i * 23) * relicIds.length);
    const relicId = relicIds[idx];
    const relic = RELICS[relicId];
    return {
      relicId,
      price: RELIC_RARITY_PRICE[relic.rarity || "common"] ?? RELIC_RARITY_PRICE.common,
      sold: false,
    };
  });

  return { layerIndex, cards, relics };
}

export function addPlayerCard(state, cardKey) {
  state.player.deckKeys.push(cardKey);
}

export function addPlayerRelic(state, relicId) {
  if (!state.player.relics.includes(relicId)) {
    state.player.relics.push(relicId);
  }
}

export function computeGlycogenReward(state, nodeType) {
  const layerIndex = state.layerIndex ?? 0;
  let base;
  if (nodeType === "combat") {
    base = 5 * (layerIndex + 1);
  } else if (nodeType === "elite") {
    base = Math.floor(5 * (layerIndex + 1) * 1.6);
  } else {
    base = GLYCOGEN_REWARDS[nodeType] || GLYCOGEN_REWARDS.combat;
  }
  const hasGoldRelic = state.player.relics.includes("gold-relic");
  return Math.floor(base * (hasGoldRelic ? 1.3 : 1));
}

export function addMapLink(state, fromNodeId, toNodeId) {
  const from = findNodeById(state, fromNodeId);
  const to = findNodeById(state, toNodeId);
  if (!from || !to) return false;
  const fromNode = from.node;
  const toNode = to.node;
  if (fromNode.id === toNode.id) return false;
  if (fromNode.layerIndex !== toNode.layerIndex) return false;
  if (fromNode.x >= toNode.x) return false;
  if (fromNode.nextIds.includes(toNode.id)) return false;

  fromNode.nextIds.push(toNode.id);
  toNode.prevIds.push(fromNode.id);

  // 如果起点已清理且目标未解锁，则自动解锁目标节点
  if (fromNode.cleared && !toNode.unlocked) {
    toNode.unlocked = true;
  }
  return true;
}

export function createCombatRewards(state, nodeType) {
  const cardCount = state.player.relics.includes("reward-relic") ? 3 : 2;
  return {
    glycogen: computeGlycogenReward(state, nodeType),
    cards: pickRewardCards(cardCount),
  };
}

export function ensureShop(state) {
  if (!state.currentShop || state.currentShop.layerIndex !== state.layerIndex) {
    state.currentShop = generateShopInventory(state.layerIndex);
  }
  return state.currentShop;
}

export function buyShopCard(state, slotIndex) {
  const shop = ensureShop(state);
  const slot = shop.cards[slotIndex];
  if (!slot || slot.sold || state.player.glycogen < slot.price) return false;
  state.player.glycogen -= slot.price;
  addPlayerCard(state, slot.card.key);
  slot.sold = true;
  return true;
}

export function buyShopRelic(state, slotIndex) {
  const shop = ensureShop(state);
  const slot = shop.relics[slotIndex];
  if (!slot || slot.sold || state.player.glycogen < slot.price) return false;
  state.player.glycogen -= slot.price;
  addPlayerRelic(state, slot.relicId);
  slot.sold = true;
  if (slot.relicId === "map-link-relic") {
    state.mapLinkMode = true;
  }
  return true;
}

export { HEROES, TRAITS };
