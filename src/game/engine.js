import {
  HEROES,
  TRAITS,
  getCardDefinition,
  getEnemyBlueprint,
  getStarterDeck,
} from "../data/content.js";

let runtimeId = 1;

function nextId(prefix) {
  runtimeId += 1;
  return `${prefix}-${runtimeId}`;
}

function cloneState(state) {
  return structuredClone(state);
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeckInstances(state) {
  const cards = state.player?.deckKeys?.length
    ? state.player.deckKeys.map((key) => getCardDefinition(key)).filter(Boolean)
    : getStarterDeck(state.classId);
  return shuffle(cards).map((card) => ({
    ...card,
    instanceId: nextId(card.key),
  }));
}

function materializeEnemy(id) {
  const blueprint = getEnemyBlueprint(id);
  return {
    ...blueprint,
    instanceId: nextId(id),
    hp: blueprint.maxHp,
    block: 0,
    intentIndex: 0,
    intent: blueprint.intentCycle[0],
    status: {
      exposed: 0,
      poison: 0,
    },
  };
}

function pushLog(state, text) {
  state.log.push(text);
  if (state.log.length > 40) {
    state.log = state.log.slice(-40);
  }
}

function createReport() {
  return {
    events: [],
  };
}

function enqueueFloater(report, target, text, tone = "damage") {
  report.events.push({ type: "floater", target, text, tone });
}

function enqueueBanner(report, label, sublabel, tone = "neutral") {
  report.events.push({ type: "banner", label, sublabel, tone });
}

function enqueueShake(report, force = "soft") {
  report.events.push({ type: "shake", force });
}

function enqueueCardFlow(report, kind, cards) {
  if (cards?.length) report.events.push({ type: "cardFlow", kind, cards });
}

function enqueueActorAction(report, actorId) {
  report.events.push({ type: "actorAction", actorId, action: "attack" });
}

function enqueueHitFx(report, target, result) {
  const effects = [];
  if (result.blocked > 0) effects.push(result.remainingBlock > 0 ? "armor" : "break");
  if (result.actual > 0) effects.push("hit");
  if (effects.length) report.events.push({ type: "hitFx", target, effects });
}

function intentDealsDamage(intent) {
  return ["attack", "miniSweep", "stripAttack", "attackAndGuard", "attackAll"].includes(intent?.type);
}

function drawCardsRaw(deck, discard, count) {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const drawn = [];

  for (let i = 0; i < count; i += 1) {
    if (!nextDeck.length && nextDiscard.length) {
      nextDeck = shuffle(nextDiscard);
      nextDiscard = [];
    }
    if (!nextDeck.length) {
      break;
    }
    drawn.push(nextDeck.shift());
  }

  return {
    deck: nextDeck,
    discard: nextDiscard,
    drawn,
  };
}

function drawCards(state, count, report, label = "摸牌") {
  const result = drawCardsRaw(state.player.deck, state.player.discard, count);
  state.player.deck = result.deck;
  state.player.discard = result.discard;
  state.player.hand.push(...result.drawn);
  if (result.drawn.length) {
    enqueueCardFlow(report, "draw", result.drawn);
    enqueueFloater(report, "deck", `+${result.drawn.length} 抽`, "draw");
    pushLog(state, `${label}：抽了 ${result.drawn.length} 张牌。`);
  }
}

function discardHand(state) {
  const discarded = [...state.player.hand];
  state.player.discard.push(...discarded);
  state.player.hand = [];
  return discarded;
}

function countReadyMinis(player) {
  return player.minis.filter((mini) => mini.ready).length;
}

function createMini(kind = "basic", attack = 1, maturityThreshold = 1) {
  return {
    id: nextId("mini"),
    hp: 3,
    maxHp: 3,
    growth: 0,
    ready: false,
    kind,
    attack,
    maturityThreshold,
    deathrattleIcon: ["bomb", "poison", "draw"].includes(kind) ? kind : null,
    hasDevoured: false,
  };
}

function createSpecialMini(kind) {
  const specs = {
    basic: { hp: 3, maxHp: 3, attack: 1, maturityThreshold: 1 },
    vampire: { hp: 3, maxHp: 3, attack: 2, maturityThreshold: 2 },
    energy: { hp: 2, maxHp: 2, attack: 0, maturityThreshold: 3 },
    buffer: { hp: 3, maxHp: 3, attack: 1, maturityThreshold: 2 },
    "re-attack": { hp: 3, maxHp: 3, attack: 1, maturityThreshold: 3 },
    devourer: { hp: 4, maxHp: 4, attack: 1, maturityThreshold: 3 },
    bomb: { hp: 2, maxHp: 2, attack: 1, maturityThreshold: 2 },
    poison: { hp: 2, maxHp: 2, attack: 1, maturityThreshold: 2 },
    draw: { hp: 2, maxHp: 2, attack: 1, maturityThreshold: 2 },
  };
  const spec = specs[kind] || specs.basic;
  return { ...createMini(kind, spec.attack, spec.maturityThreshold), ...spec };
}

function summonMinis(state, amount, report, kind = "basic") {
  for (let i = 0; i < amount; i += 1) {
    if (state.player.minis.length >= 5) {
      break;
    }
    const mini = kind === "basic" ? createMini() : createSpecialMini(kind);
    state.player.minis.push(mini);
    enqueueFloater(report, `mini:${mini.id}`, "出芽", "summon");
  }
  if (amount > 0) {
    pushLog(state, `小金针菇冒出来了 ${Math.min(amount, 5)} 只。`);
  }
}

function summonSpecialMini(state, kind, report) {
  if (state.player.minis.length >= 5) {
    pushLog(state, "小金针菇群落已满，新的分身无法出芽。");
    return;
  }
  const mini = createSpecialMini(kind);
  state.player.minis.push(mini);
  enqueueFloater(report, `mini:${mini.id}`, "出芽", "summon");
  pushLog(state, `特殊小金针菇 ${mini.kind} 冒出来了。`);
}

function growMinis(state, amount, report) {
  if (!state.player.minis.length) {
    return;
  }
  state.player.minis = state.player.minis.map((mini) => {
    const growth = Math.min(mini.maturityThreshold, mini.growth + amount);
    return {
      ...mini,
      growth,
      ready: growth >= mini.maturityThreshold,
    };
  });
  enqueueFloater(report, "player", `菌群 +${amount}`, "growth");
  checkDevourerMaturity(state, report);
}

function checkDevourerMaturity(state, report) {
  const devourers = state.player.minis.filter(
    (m) => m.kind === "devourer" && m.ready && !m.hasDevoured,
  );
  devourers.forEach((devourer) => {
    devourer.hasDevoured = true;
    const others = state.player.minis.filter((m) => m.id !== devourer.id);
    if (!others.length) return;

    const totalAttack = others.reduce((sum, m) => sum + m.attack, 0);
    const totalHp = others.reduce((sum, m) => sum + m.hp, 0);

    others.forEach((m) => {
      onMiniDeath(state, m, report, "被吞噬", null, false);
    });
    state.player.minis = state.player.minis.filter((m) => m.id === devourer.id);

    devourer.attack += totalAttack * 2;
    devourer.maxHp += totalHp * 2;
    devourer.hp += totalHp * 2;
    enqueueFloater(report, `mini:${devourer.id}`, "吞噬进化", "trait");
    pushLog(
      state,
      `吞噬者吞噬了所有分身，攻击 ${devourer.attack}，HP ${devourer.hp}/${devourer.maxHp}。`,
    );
  });
}

function gainBlock(entity, amount) {
  entity.block += amount;
}

function healEntity(entity, amount) {
  entity.hp = Math.min(entity.maxHp, entity.hp + amount);
}

function getAliveEnemies(state) {
  return state.enemies.filter((enemy) => enemy.hp > 0);
}

function getFirstAliveEnemyId(state) {
  return getAliveEnemies(state)[0]?.instanceId ?? null;
}

function consumeExposed(enemy) {
  const bonus = enemy.status?.exposed || 0;
  if (bonus > 0) {
    enemy.status.exposed = 0;
  }
  return bonus;
}

function applyDamage(target, amount) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const actual = Math.max(0, amount - blocked);
  target.hp -= actual;
  return { actual, blocked, remainingBlock: target.block };
}

function removeDeadMinis(state) {
  state.player.minis = state.player.minis.filter((mini) => mini.hp > 0);
}

function applyMiniDeathrattle(state, mini, report, killerEnemyId = null) {
  if (mini.kind === "bomb") {
    getAliveEnemies(state).forEach((enemy) => {
      dealDamageToEnemy(state, enemy.instanceId, mini.attack * 2, report, "爆菇亡语");
    });
  }
  if (mini.kind === "poison" && killerEnemyId) {
    const killer = findEnemy(state, killerEnemyId);
    if (killer) {
      killer.status.poison = (killer.status.poison || 0) + mini.attack * 2;
      enqueueFloater(report, `enemy:${killer.instanceId}`, `毒${mini.attack * 2}`, "trait");
    }
  }
  if (mini.kind === "draw") {
    drawCards(state, 1, report, "抽丝亡语");
  }
}

function onMiniDeath(state, mini, report, reason = "碎掉了", killerEnemyId = null, triggerDeathrattle = true) {
  state.player.deadMinis += 1;
  enqueueFloater(report, `mini:${mini.id}`, reason, "death");
  if (triggerDeathrattle) {
    applyMiniDeathrattle(state, mini, report, killerEnemyId);
  }
  pushLog(state, `小金针菇 ${reason}。`);
}

function damageMini(state, miniId, amount, report, source = "受伤", killerEnemyId = null) {
  const mini = state.player.minis.find((unit) => unit.id === miniId);
  if (!mini) {
    return 0;
  }
  const actual = Math.min(mini.hp, amount);
  mini.hp -= actual;
  enqueueHitFx(report, `mini:${mini.id}`, { actual, blocked: 0, remainingBlock: 0 });
  enqueueFloater(report, `mini:${mini.id}`, `-${actual}`, "damage");
  if (mini.hp <= 0) {
    onMiniDeath(state, mini, report, "被煮烂", killerEnemyId);
    removeDeadMinis(state);
  }
  pushLog(state, `${source}：小金针菇承受了 ${actual} 点伤害。`);
  return actual;
}

function findEnemy(state, enemyId) {
  return state.enemies.find((enemy) => enemy.instanceId === enemyId);
}

function removeDeadEnemies(state) {
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
}

function dealDamageToEnemy(state, enemyId, amount, report, source = "攻击") {
  const enemy = findEnemy(state, enemyId);
  if (!enemy) {
    return 0;
  }
  const finalAmount = amount + consumeExposed(enemy);
  const result = applyDamage(enemy, finalAmount);
  enqueueHitFx(report, `enemy:${enemy.instanceId}`, result);
  enqueueFloater(report, `enemy:${enemy.instanceId}`, `-${result.actual}`, "damage");
  if (result.blocked > 0) {
    enqueueFloater(report, `enemy:${enemy.instanceId}`, `挡 ${result.blocked}`, "block");
  }
  if (result.actual > 0) {
    pushLog(state, `${source}：${enemy.name} 受到 ${result.actual} 点伤害。`);
  }
  if (enemy.hp <= 0) {
    pushLog(state, `${enemy.name} 散成一滩。`);
    state.lastRemovedEnemy = { ...enemy, hp: 0 };
  }
  removeDeadEnemies(state);
  return result.actual;
}

function hitPlayerDirect(state, amount, report, source = "受伤", attackerId = null) {
  const result = applyDamage(state.player, amount);
  enqueueHitFx(report, "player", result);
  enqueueFloater(report, "player", `-${result.actual}`, "damage");
  if (result.blocked > 0) {
    enqueueFloater(report, "player", `挡 ${result.blocked}`, "block");
  }
  if (result.actual > 0) {
    enqueueShake(report, amount >= 10 ? "heavy" : "soft");
  }
  pushLog(state, `${source}：你承受了 ${result.actual} 点伤害。`);

  if (attackerId && state.player.status.retaliate > 0) {
    const thorns = state.player.status.retaliate;
    const enemy = findEnemy(state, attackerId);
    if (enemy) {
      dealDamageToEnemy(state, attackerId, thorns, report, "反震");
      pushLog(state, `果壳回弹了 ${thorns} 点伤害。`);
    }
  }
}

function hitPlayerFromEnemy(state, amount, report, source, attackerId) {
  if (
    state.player.classId === "enoki" &&
    state.player.status.decoyReady > 0 &&
    state.player.minis.length
  ) {
    state.player.status.decoyReady -= 1;
    const oldestMini = state.player.minis[0];
    pushLog(state, `菌葬仪式启动，${oldestMini.id} 抢在你前面挨了这一下。`);
    damageMini(state, oldestMini.id, amount, report, source, attackerId);
    return;
  }
  hitPlayerDirect(state, amount, report, source, attackerId);
}

function hitAllMinis(state, amount, report, source, attackerId = null) {
  if (!state.player.minis.length) {
    return false;
  }
  const snapshot = [...state.player.minis];
  snapshot.forEach((mini) => {
    if (
      state.player.classId === "enoki" &&
      state.player.status.bodyguardHits > 0
    ) {
      state.player.status.bodyguardHits -= 1;
      pushLog(state, `你替 ${mini.id} 把伤害硬接了下来。`);
      hitPlayerDirect(state, amount, report, "替分身挡伤");
    } else {
      damageMini(state, mini.id, amount, report, source, attackerId);
    }
  });
  return true;
}

function checkCombatState(state, report) {
  if (state.player.hp <= 0) {
    state.phase = "defeat";
    enqueueBanner(report, "消化失败", "你被卷成了新的食糜", "defeat");
    return;
  }
  if (!getAliveEnemies(state).length) {
    state.phase = "victory";
    enqueueBanner(report, "战斗清场", "", "victory");
  }
}

function castTrait(state, traitId, report, targetEnemyId, potency = 1, label = "壳芯释放") {
  if (!traitId || !TRAITS[traitId]) {
    return;
  }
  const trait = TRAITS[traitId];
  const targetId = targetEnemyId || getFirstAliveEnemyId(state);
  enqueueBanner(report, trait.name, label, "trait");

  switch (traitId) {
    case "acidSplash": {
      if (targetId) {
        dealDamageToEnemy(state, targetId, 4 + potency, report, trait.name);
      }
      getAliveEnemies(state)
        .filter((enemy) => enemy.instanceId !== targetId)
        .forEach((enemy) => dealDamageToEnemy(state, enemy.instanceId, 1 + potency, report, "酸液溅射"));
      break;
    }
    case "mucusWrap":
      gainBlock(state.player, 5 + potency * 2);
      state.player.status.retaliate = Math.max(state.player.status.retaliate, 2 + potency);
      enqueueFloater(report, "player", `+${5 + potency * 2} 壳`, "block");
      break;
    case "bileJet":
      if (targetId) {
        dealDamageToEnemy(state, targetId, 3 + potency, report, trait.name);
      }
      drawCards(state, 1, report, "胆汁回流");
      break;
    case "villusSnare": {
      if (targetId) {
        const target = findEnemy(state, targetId);
        if (target) {
          target.block = Math.max(0, target.block - (3 + potency));
          target.status.exposed = 2 + potency;
          enqueueFloater(report, `enemy:${target.instanceId}`, "露馅", "trait");
          pushLog(state, `${target.name} 被绒毛绞得破绽大开。`);
        }
      }
      break;
    }
    case "gasBurst":
      getAliveEnemies(state).forEach((enemy) =>
        dealDamageToEnemy(state, enemy.instanceId, 2 + potency, report, trait.name),
      );
      break;
    case "clotClamp":
      gainBlock(state.player, 6 + potency * 2);
      healEntity(state.player, potency);
      state.player.status.retaliate = Math.max(state.player.status.retaliate, 3 + potency);
      enqueueFloater(report, "player", `+${6 + potency * 2} 壳`, "block");
      enqueueFloater(report, "player", `+${potency}`, "heal");
      break;
    case "dryPlug":
      if (targetId) {
        dealDamageToEnemy(state, targetId, 6 + potency, report, trait.name);
      }
      gainBlock(state.player, 2 + potency);
      enqueueFloater(report, "player", `+${2 + potency} 壳`, "block");
      break;
    case "putridRush":
      getAliveEnemies(state).forEach((enemy) =>
        dealDamageToEnemy(state, enemy.instanceId, 2 + potency, report, trait.name),
      );
      healEntity(state.player, potency + 1);
      enqueueFloater(report, "player", `+${potency + 1}`, "heal");
      break;
    default:
      break;
  }
  checkCombatState(state, report);
}

function absorbTrait(state, enemy, report) {
  const traitId = enemy.traitId;
  if (!traitId) {
    return;
  }
  const trait = TRAITS[traitId];
  if (state.player.classId !== "macadamia") {
    return;
  }

  if (state.player.lastAbsorbedTraitId === traitId || state.player.currentTraitId === traitId) {
    state.player.focusChain = Math.min(4, (state.player.focusChain || 1) + 1);
  } else {
    state.player.focusChain = 1;
  }
  state.player.lastAbsorbedTraitId = traitId;

  const known = state.player.traits.find((entry) => entry.id === traitId);
  if (known) {
    known.stacks += 1;
  } else {
    state.player.traits.push({ id: traitId, stacks: 1 });
    if (state.player.traits.length > 4) {
      state.player.traits.shift();
    }
  }
  state.player.currentTraitId = traitId;

  enqueueBanner(report, `吸收 ${trait.name}`, enemy.name, "trait");
  enqueueFloater(report, "player", trait.short, "trait");
  pushLog(state, `你把 ${enemy.name} 的“${trait.name}”封进了果壳。`);
}

function triggerMiniAttack(state, mini, targetEnemyId, report, source = "成熟分身支援") {
  if (!mini?.ready || mini.attack <= 0 || !targetEnemyId) return;
  enqueueActorAction(report, `mini:${mini.id}`);
  dealDamageToEnemy(state, targetEnemyId, mini.attack, report, source);
  enqueueFloater(report, `mini:${mini.id}`, "援击", "trait");

  if (mini.kind === "vampire") {
    healEntity(state.player, mini.attack);
    enqueueFloater(report, "player", `+${mini.attack}`, "heal");
  }

  if (mini.kind === "buffer") {
    const index = state.player.minis.findIndex((unit) => unit.id === mini.id);
    [index - 1, index + 1].forEach((neighborIndex) => {
      const neighbor = state.player.minis[neighborIndex];
      if (!neighbor) return;
      neighbor.attack += 1;
      neighbor.maxHp += 1;
      neighbor.hp += 1;
      enqueueFloater(report, `mini:${neighbor.id}`, "+1/+1", "growth");
    });
  }
}

function useEnokiAssist(state, card, targetEnemyId, report) {
  if (state.player.classId !== "enoki" || card.suite !== "attack") {
    return;
  }
  const readyMinis = state.player.minis.filter((mini) => mini.ready);
  if (!readyMinis.length) {
    return;
  }
  const actualTarget = targetEnemyId || getFirstAliveEnemyId(state);
  if (!actualTarget) {
    return;
  }
  readyMinis.forEach((mini, index) => {
    triggerMiniAttack(state, mini, actualTarget, report);
    if (mini.kind === "re-attack" && index > 0) {
      triggerMiniAttack(state, readyMinis[index - 1], actualTarget, report, "连击菌丝");
    }
  });
}

function refreshEnemyIntents(state) {
  state.enemies = state.enemies.map((enemy) => ({
    ...enemy,
    intent: enemy.intentCycle[enemy.intentIndex % enemy.intentCycle.length],
  }));
}

function rotateCurrentTrait(state) {
  if (state.player.traits.length < 2) {
    return false;
  }
  const currentIndex = state.player.traits.findIndex((entry) => entry.id === state.player.currentTraitId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % state.player.traits.length;
  state.player.currentTraitId = state.player.traits[nextIndex].id;
  return true;
}

function playCardEffect(state, card, targetEnemyId, report) {
  switch (card.key) {
    case "cap-jab":
      if (targetEnemyId) {
        dealDamageToEnemy(state, targetEnemyId, 6, report, card.name);
      }
      break;
    case "split-cluster":
      summonMinis(state, 1, report);
      drawCards(state, 1, report, card.name);
      break;
    case "tender-guard": {
      const block = state.player.minis.length ? 10 : 7;
      gainBlock(state.player, block);
      enqueueFloater(report, "player", `+${block} 壳`, "block");
      break;
    }
    case "mycelial-shelter":
      growMinis(state, 1, report);
      gainBlock(state.player, 5);
      state.player.status.bodyguardHits = 2;
      enqueueFloater(report, "player", "+5 壳", "block");
      break;
    case "patient-canopy": {
      growMinis(state, 1, report);
      const readyMinis = state.player.minis.filter((mini) => mini.ready);
      if (readyMinis.length && targetEnemyId) {
        readyMinis.forEach((mini) => {
          dealDamageToEnemy(state, targetEnemyId, 5, report, card.name);
          enqueueFloater(report, `mini:${mini.id}`, "齐射", "trait");
        });
        gainBlock(state.player, readyMinis.length * 2);
        enqueueFloater(report, "player", `+${readyMinis.length * 2} 壳`, "block");
      }
      break;
    }
    case "butter-pyre": {
      const oldestMini = state.player.minis[0];
      const damage = oldestMini ? 12 + state.player.deadMinis * 2 : 6;
      if (oldestMini) {
        damageMini(state, oldestMini.id, oldestMini.hp, report, "黄油火葬");
        state.player.energy += 1;
        enqueueFloater(report, "energy", "+1 能", "energy");
      }
      if (targetEnemyId) {
        dealDamageToEnemy(state, targetEnemyId, damage, report, card.name);
      }
      break;
    }
    case "funeral-bloom": {
      summonMinis(state, 2, report);
      const extra = state.player.deadMinis;
      if (extra > 0) {
        gainBlock(state.player, extra * 3);
        enqueueFloater(report, "player", `+${extra * 3} 壳`, "block");
        drawCards(state, extra, report, card.name);
      }
      break;
    }
    case "summon-vampire":
      hitPlayerDirect(state, 1, report, "血菇寄生");
      summonSpecialMini(state, "vampire", report);
      break;
    case "summon-energy":
      summonSpecialMini(state, "energy", report);
      break;
    case "summon-buffer":
      summonSpecialMini(state, "buffer", report);
      break;
    case "summon-re-attack":
      summonSpecialMini(state, "re-attack", report);
      break;
    case "summon-devourer":
      summonSpecialMini(state, "devourer", report);
      break;
    case "summon-bomb":
      summonSpecialMini(state, "bomb", report);
      break;
    case "summon-poison":
      summonSpecialMini(state, "poison", report);
      break;
    case "summon-draw":
      summonSpecialMini(state, "draw", report);
      break;
    case "accelerate-growth":
      growMinis(state, 1, report);
      break;
    case "shell-bash":
      if (targetEnemyId) {
        dealDamageToEnemy(state, targetEnemyId, 6, report, card.name);
      }
      if (state.player.currentTraitId) {
        castTrait(state, state.player.currentTraitId, report, targetEnemyId, 1, card.name);
      }
      break;
    case "crack-and-seal": {
      const before = targetEnemyId ? findEnemy(state, targetEnemyId)?.hp ?? 0 : 0;
      if (targetEnemyId) {
        dealDamageToEnemy(state, targetEnemyId, 5, report, card.name);
      }
      const enemy = targetEnemyId ? findEnemy(state, targetEnemyId) : null;
      if (!enemy) {
        const fallen = state.lastRemovedEnemy;
        if (fallen?.traitId && before <= 8) {
          absorbTrait(state, fallen, report);
        }
        break;
      }
      if (enemy.hp <= 6 || before <= 8) {
        absorbTrait(state, enemy, report);
      }
      break;
    }
    case "kernel-recall": {
      const bonus = state.player.currentTraitId ? 6 : 4;
      gainBlock(state.player, bonus);
      enqueueFloater(report, "player", `+${bonus} 壳`, "block");
      drawCards(state, 1, report, card.name);
      break;
    }
    case "mono-resonance": {
      const chain = Math.max(1, state.player.focusChain || 1);
      if (targetEnemyId) {
        dealDamageToEnemy(state, targetEnemyId, 5, report, card.name);
      }
      if (state.player.currentTraitId) {
        castTrait(state, state.player.currentTraitId, report, targetEnemyId, chain, card.name);
      }
      break;
    }
    case "pressure-polish": {
      const chain = Math.max(1, state.player.focusChain || 1);
      if (targetEnemyId) {
        dealDamageToEnemy(state, targetEnemyId, 10 + chain * 2, report, card.name);
      }
      if (state.player.currentTraitId) {
        castTrait(state, state.player.currentTraitId, report, targetEnemyId, chain, card.name);
      }
      break;
    }
    case "trait-carousel":
      if (rotateCurrentTrait(state)) {
        enqueueFloater(report, "player", "换芯", "trait");
        pushLog(state, `当前壳芯切换成了 ${TRAITS[state.player.currentTraitId].name}。`);
      }
      drawCards(state, 1, report, card.name);
      break;
    case "pantry-choir": {
      if (targetEnemyId) {
        dealDamageToEnemy(state, targetEnemyId, 4, report, card.name);
      }
      state.player.traits.forEach((entry) => {
        castTrait(state, entry.id, report, targetEnemyId, Math.max(1, Math.ceil(entry.stacks / 2)), card.name);
      });
      break;
    }
    default:
      break;
  }
}

function removeCardFromHand(player, cardId) {
  const idx = player.hand.findIndex((card) => card.instanceId === cardId);
  if (idx < 0) {
    return null;
  }
  const [card] = player.hand.splice(idx, 1);
  return card;
}

function canPlayCard(state, card) {
  if (!card) {
    return false;
  }
  if (state.phase !== "player") {
    return false;
  }
  if (state.player.energy < card.cost) {
    return false;
  }
  if (card.target === "enemy" && !getAliveEnemies(state).length) {
    return false;
  }
  if (card.key === "trait-carousel" && state.player.traits.length < 2) {
    return false;
  }
  return true;
}

function captureRemovedEnemies(beforeEnemies, afterEnemies) {
  const afterIds = new Set(afterEnemies.map((enemy) => enemy.instanceId));
  return beforeEnemies.filter((enemy) => !afterIds.has(enemy.instanceId));
}

export function openEncounter(baseState, layer, encounter, heal = 0) {
  const state = cloneState(baseState);
  const deck = buildDeckInstances(state);
  const draw = drawCardsRaw(deck, [], 5);

  state.layerIndex = layer.layerIndex;
  state.currentEncounter = {
    ...encounter,
    layerName: layer.name,
    layerSubtitle: layer.subtitle,
    accent: layer.accent,
    surface: layer.surface,
  };
  state.phase = "player";
  state.turn = 1;
  state.enemies = encounter.enemyIds.map(materializeEnemy);
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
  state.player.energy = state.player.maxEnergy;
  state.player.block = 0;
  state.player.deck = draw.deck;
  state.player.discard = [];
  state.player.hand = draw.drawn;
  state.player.minis = [];
  state.player.deadMinis = 0;
  state.player.currentTraitId = null;
  state.player.focusChain = 0;
  state.player.lastAbsorbedTraitId = null;
  state.player.traits = [];
  state.player.status = {
    bodyguardHits: 0,
    retaliate: 0,
    decoyReady: 0,
  };
  state.log = [];
  pushLog(state, `进入 ${layer.name} · ${encounter.name}。`);
  pushLog(state, encounter.note);
  refreshEnemyIntents(state);
  return state;
}

export function getValidTargets(state, card) {
  if (!card || card.target !== "enemy") {
    return [];
  }
  return getAliveEnemies(state).map((enemy) => enemy.instanceId);
}

export function playCard(state, cardId, targetEnemyId = null) {
  const next = cloneState(state);
  const report = createReport();
  const card = next.player.hand.find((entry) => entry.instanceId === cardId);

  if (!canPlayCard(next, card)) {
    return { nextState: state, report };
  }

  const targetId = card.target === "enemy" ? targetEnemyId || getFirstAliveEnemyId(next) : null;
  next.player.energy -= card.cost;
  const playedCard = removeCardFromHand(next.player, cardId);
  if (!playedCard) {
    return { nextState: state, report };
  }
  next.lastRemovedEnemy = null;

  enqueueCardFlow(report, "play", [playedCard]);
  if (playedCard.suite === "attack") enqueueActorAction(report, "player");
  enqueueBanner(report, playedCard.name, `${playedCard.cost} 能量`, playedCard.suite === "attack" ? "attack" : "skill");
  pushLog(next, `你打出了【${playedCard.name}】。`);

  const enemySnapshot = next.enemies.map((enemy) => ({ ...enemy }));
  playCardEffect(next, playedCard, targetId, report);
  useEnokiAssist(next, playedCard, targetId, report);
  checkCombatState(next, report);
  const removed = captureRemovedEnemies(enemySnapshot, next.enemies);
  if (!next.lastRemovedEnemy && removed[0]) {
    next.lastRemovedEnemy = removed[0];
  }
  next.player.discard.push(playedCard);

  return { nextState: next, report };
}

export function endPlayerTurn(state) {
  const next = cloneState(state);
  const report = createReport();
  enqueueCardFlow(report, "discard", discardHand(next));
  next.phase = "enemy";
  next.player.status.decoyReady = 0;
  next.enemies.forEach((enemy) => {
    enemy.block = 0;
  });
  enqueueBanner(report, "敌方回合", `第 ${next.turn} 轮`, "enemy");
  pushLog(next, "你收起手牌，肠壁开始反击。");
  return { nextState: next, report };
}

export function resolveEnemyAction(state, enemyId) {
  const next = cloneState(state);
  const report = createReport();
  const enemy = findEnemy(next, enemyId);
  if (!enemy || enemy.hp <= 0) {
    return { nextState: next, report };
  }

  const intent = enemy.intent;
  if (intentDealsDamage(intent)) enqueueActorAction(report, enemy.instanceId);
  enqueueBanner(report, enemy.name, intent.label, "enemy");

  switch (intent.type) {
    case "attack":
      hitPlayerFromEnemy(next, intent.value, report, `${enemy.name}·${intent.label}`, enemy.instanceId);
      break;
    case "guard":
      gainBlock(enemy, intent.value);
      enqueueFloater(report, `enemy:${enemy.instanceId}`, `+${intent.value} 壳`, "block");
      if (intent.heal) {
        healEntity(enemy, intent.heal);
        enqueueFloater(report, `enemy:${enemy.instanceId}`, `+${intent.heal}`, "heal");
      }
      pushLog(next, `${enemy.name} 缩进组织褶皱里，攒了 ${intent.value} 点格挡。`);
      break;
    case "miniSweep":
      if (!hitAllMinis(next, intent.value, report, `${enemy.name}·${intent.label}`, enemy.instanceId)) {
        hitPlayerFromEnemy(next, intent.fallback, report, `${enemy.name}·${intent.label}`, enemy.instanceId);
      }
      break;
    case "stripAttack":
      next.player.block = Math.max(0, next.player.block - intent.strip);
      enqueueFloater(report, "player", `破 ${intent.strip}`, "trait");
      hitPlayerFromEnemy(next, intent.value, report, `${enemy.name}·${intent.label}`, enemy.instanceId);
      break;
    case "attackAndGuard":
      hitPlayerFromEnemy(next, intent.value, report, `${enemy.name}·${intent.label}`, enemy.instanceId);
      gainBlock(enemy, intent.guard);
      enqueueFloater(report, `enemy:${enemy.instanceId}`, `+${intent.guard} 壳`, "block");
      break;
    case "attackAll":
      hitPlayerFromEnemy(next, intent.value, report, `${enemy.name}·${intent.label}`, enemy.instanceId);
      if (next.player.minis.length && intent.miniValue) {
        hitAllMinis(next, intent.miniValue, report, `${enemy.name}·${intent.label}`, enemy.instanceId);
      }
      break;
    default:
      break;
  }

  enemy.intentIndex = (enemy.intentIndex + 1) % enemy.intentCycle.length;
  enemy.intent = enemy.intentCycle[enemy.intentIndex];
  checkCombatState(next, report);
  return { nextState: next, report };
}

export function startNextPlayerTurn(state) {
  const next = cloneState(state);
  const report = createReport();

  next.phase = "player";
  next.turn += 1;

  const keepPlayerBlock = next.player.relics.includes("barrier-keep-relic");
  if (!keepPlayerBlock) {
    next.player.block = 0;
  } else if (next.player.block > 0) {
    enqueueFloater(report, "player", `保留 ${next.player.block} 格挡`, "block");
  }

  next.player.energy = next.player.maxEnergy;
  next.player.status.bodyguardHits = 0;
  next.player.status.retaliate = 0;

  next.enemies.forEach((enemy) => {
    const poison = enemy.status?.poison || 0;
    if (poison > 0 && enemy.hp > 0) {
      dealDamageToEnemy(next, enemy.instanceId, poison, report, "中毒");
      enemy.status.poison = Math.max(0, poison - 1);
      enqueueFloater(report, `enemy:${enemy.instanceId}`, `毒-${poison}`, "trait");
    }
  });
  checkCombatState(next, report);
  if (next.phase !== "player") {
    return { nextState: next, report };
  }

  if (next.player.classId === "enoki" && next.player.minis.length) {
    growMinis(next, 1, report);
    next.player.minis
      .filter((mini) => mini.ready && mini.kind === "energy")
      .forEach((mini) => {
        next.player.energy += 1;
        enqueueFloater(report, `mini:${mini.id}`, "+1 能", "energy");
      });
  }

  drawCards(next, 5, report, "新回合");
  refreshEnemyIntents(next);
  enqueueBanner(report, "你的回合", `第 ${next.turn} 轮`, "player");
  pushLog(next, "你踩稳了地面，重新摸满手牌。");
  return { nextState: next, report };
}

export function getCurrentTheme(state) {
  return state.currentEncounter
    ? {
        accent: state.currentEncounter.accent,
        surface: state.currentEncounter.surface,
      }
    : { accent: "#d4d785", surface: "#392626" };
}

export function getBuildInfo(classId, buildId) {
  return HEROES[classId].builds[buildId];
}
