import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FastForward, Heart, LogOut, Map, Shield, Skull, Sword, X } from "lucide-react";
import { HEROES, MAP_CONFIG, TRAITS } from "./data/content";
import {
  addMapLink,
  buyShopCard,
  buyShopRelic,
  createCombatRewards,
  advanceToLayer,
  createRunState,
  ensureShop,
  findNodeById,
  getCurrentLayer,
  getCurrentNode,
  isFinalBossNode,
  makeEncounterFromNode,
  markNodeCleared,
  restAtCampfire,
  unlockNextNodes,
} from "./game/navigation";
import {
  endPlayerTurn,
  getCurrentTheme,
  getValidTargets,
  openEncounter,
  playCard,
  resolveEnemyAction,
  startNextPlayerTurn,
} from "./game/engine";
import { HandFan } from "./components/HandFan";
import { CardView } from "./components/CardView";
import { FxFloaters, HitFxLayer } from "./components/FxLayer";
import { EnemyPanel } from "./components/EnemyPanel";
import { BattleAvatar } from "./components/BattleAvatar";
import { StatChip } from "./components/StatChip";
import { TitleScreen } from "./screens/TitleScreen";
import { HeroSelectScreen } from "./screens/HeroSelectScreen";
import { MapScreen } from "./screens/MapScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { EventScreen } from "./screens/EventScreen";
import { CampfireScreen } from "./screens/CampfireScreen";
import { VictoryModal } from "./screens/VictoryModal";
import { DefeatModal } from "./screens/DefeatModal";

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function makeTargetKey(kind, id) {
  return `${kind}:${id}`;
}

function PileButton({ type, count, onClick }) {
  return (
    <button type="button" className={`pile-button pile-button--${type}`} onClick={onClick}>
      <span className="pile-button__art" />
      <span className="pile-button__label">{type === "deck" ? "牌库" : "弃牌"}</span>
      <strong>{count}</strong>
    </button>
  );
}

function CardFlowLayer({ flows }) {
  if (!flows.length) return null;
  return (
    <div className="card-flow-layer">
      {flows.map((flow) => (
        <div
          key={flow.id}
          className={`flow-card flow-card--${flow.kind}`}
          style={{ "--flow-delay": `${flow.index * 110}ms` }}
        >
          <span>{flow.card.cost}</span>
          <strong>{flow.card.name}</strong>
        </div>
      ))}
    </div>
  );
}

function AimLayer({ aim, traitPreview }) {
  if (!aim) return null;
  const midX = (aim.origin.x + aim.pos.x) / 2;
  const midY = Math.min(aim.origin.y, aim.pos.y) - 90;
  const path = `M ${aim.origin.x} ${aim.origin.y} Q ${midX} ${midY} ${aim.pos.x} ${aim.pos.y}`;

  return (
    <div className="aim-layer">
      <svg className="aim-layer__svg">
        <defs>
          <marker id="aim-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <path className="aim-layer__path" d={path} markerEnd="url(#aim-arrow)" />
      </svg>
      <CardView
        card={aim.card}
        selected={false}
        playable
        floating
        traitPreview={traitPreview}
        layoutStyle={{
          left: `${aim.pos.x}px`,
          top: `${aim.pos.y}px`,
          "--card-x": "0px",
          "--card-y": "0px",
          "--card-rotate": "-4deg",
          "--card-stack": 5001,
        }}
      />
    </div>
  );
}

function DiscardModal({ cards, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="discard-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="discard-modal__close" onClick={onClose} aria-label="关闭弃牌堆">
          <X size={18} />
        </button>
        <strong>弃牌堆</strong>
        <div className="discard-modal__grid">
          {cards.length ? (
            cards.map((card) => (
              <div key={card.instanceId} className="discard-card">
                <span>{card.cost}</span>
                <strong>{card.name}</strong>
                <small>{card.description}</small>
              </div>
            ))
          ) : (
            <p>还没有弃牌。</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuitRunButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      className="meta-chip meta-chip--button"
      onClick={onClick}
      disabled={disabled}
    >
      <LogOut size={14} />
      <span>结束这段肠旅</span>
    </button>
  );
}

function RewardChoiceModal({ reward, onPick, onSkip }) {
  if (!reward) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card--victory">
        <strong>战利品</strong>
        <p>获得 {reward.glycogen} 糖原，并从以下卡牌中选择一张加入牌组。</p>
        <div className="reward-grid">
          {reward.cards.map((card) => (
            <button key={card.key} type="button" className="reward-option" onClick={() => onPick(card.key)}>
              <span className="energy-gem">{card.cost}</span>
              <strong>{card.name}</strong>
              <small>{card.description}</small>
            </button>
          ))}
        </div>
        <button type="button" className="action-button action-button--ghost" onClick={onSkip}>
          跳过选牌
        </button>
      </div>
    </div>
  );
}

function MiniMaturityBadge({ mini }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = mini.ready
    ? 1
    : Math.min(1, Math.max(0, mini.growth / mini.maturityThreshold));
  const dashArray = `${progress * circumference} ${circumference}`;
  const turnsLeft = Math.max(0, mini.maturityThreshold - mini.growth);

  return (
    <div className={`mini-maturity ${mini.ready ? "is-ready" : ""}`}>
      <svg className="mini-maturity__ring" viewBox="0 0 36 36">
        <circle className="mini-maturity__track" cx="18" cy="18" r={radius} />
        <circle
          className="mini-maturity__fill"
          cx="18"
          cy="18"
          r={radius}
          style={{ strokeDasharray: dashArray }}
        />
      </svg>
      <span className="mini-maturity__label">
        {mini.ready ? "成熟" : `${turnsLeft}回合`}
      </span>
    </div>
  );
}

function MiniTooltip({ mini }) {
  const turnsLeft = Math.max(0, mini.maturityThreshold - mini.growth);
  const kindNotes = {
    vampire: "血菇：援击时为你回复等量生命。",
    energy: "蓄能菇：成熟后每回合开始额外获得 1 点能量。",
    buffer: "缓冲菇：援击时使相邻分身各 +1/+1。",
    "re-attack": "连击菇：援击时让前一只成熟分身再攻击一次。",
    devourer: "吞噬者：成熟后会吞掉其他分身并巨幅成长。",
    bomb: "爆菇：死亡时对全体敌人造成爆炸伤害。",
    poison: "毒菇：死亡时让击杀者中毒。",
    draw: "抽丝菇：死亡时抽 1 张牌。",
  };

  const deathrattleLabels = {
    bomb: "爆炸",
    poison: "中毒",
    draw: "抽牌",
  };

  return (
    <div className="mini-tooltip">
      <strong>{mini.ready ? "成熟分身" : `幼体（还差 ${turnsLeft} 回合成熟）`}</strong>
      <span>
        攻击 {mini.attack} · 生命 {mini.hp}/{mini.maxHp}
      </span>
      {kindNotes[mini.kind] && <small>{kindNotes[mini.kind]}</small>}
      {mini.deathrattleIcon && (
        <small>
          亡语：
          {deathrattleLabels[mini.deathrattleIcon] || mini.deathrattleIcon}
        </small>
      )}
    </div>
  );
}

function MiniColony({ minis, floaters, hitFx, avatarActions }) {
  return (
    <div className="mini-colony">
      {minis.map((mini) => (
        <div key={mini.id} className={`mini-unit ${mini.ready ? "is-ready" : "is-immature"}`}>
          <FxFloaters floaters={floaters[makeTargetKey("mini", mini.id)]} />
          <HitFxLayer effects={hitFx[makeTargetKey("mini", mini.id)]} />
          <div className="mini-unit__body">
            <MiniMaturityBadge mini={mini} />
            <BattleAvatar
              isPlayer
              classId="mini-enoki"
              color="#d4d785"
              glyph=""
              label=""
              action={avatarActions[makeTargetKey("mini", mini.id)]}
            />
            {mini.deathrattleIcon && (
              <div className="mini-unit__deathmark" title="亡语">
                <Skull size={16} />
              </div>
            )}
          </div>
          <MiniTooltip mini={mini} />
          <div className="mini-unit__meta">
            <span><Sword size={12} />{mini.attack}</span>
            <span><Heart size={12} />{mini.hp}/{mini.maxHp}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TraitRack({ player }) {
  if (player.classId !== "macadamia") {
    return null;
  }

  return (
    <div className="trait-rack">
      {player.traits.length ? (
        player.traits.map((entry) => {
          const trait = TRAITS[entry.id];
          const active = player.currentTraitId === entry.id;
          return (
            <div
              key={entry.id}
              className={`trait-chip ${active ? "is-active" : ""}`}
              style={{ "--trait-color": trait.color }}
            >
              <span className="trait-chip__sigil">{trait.short}</span>
              <span className="trait-chip__name">{trait.name}</span>
              <span className="trait-chip__count">储层 {entry.stacks}</span>
            </div>
          );
        })
      ) : (
        <div className="trait-rack__empty">壳芯还是空的，等着你去捡别人临终的坏毛病。</div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("title");
  const [config, setConfig] = useState({
    classId: "enoki",
    buildId: null,
  });
  const [state, setState] = useState(() => createRunState(config));
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [aim, setAim] = useState(null);
  const [aimTargetId, setAimTargetId] = useState(null);
  const [floaters, setFloaters] = useState({});
  const [hitFx, setHitFx] = useState({});
  const [banner, setBanner] = useState(null);
  const [cardFlows, setCardFlows] = useState([]);
  const [avatarActions, setAvatarActions] = useState({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [screenShake, setScreenShake] = useState(null);
  const [showMapOverlay, setShowMapOverlay] = useState(false);
  const [hoveredCardCost, setHoveredCardCost] = useState(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [mapLinkFromId, setMapLinkFromId] = useState(null);
  const stateRef = useRef(state);
  const aimRef = useRef(null);
  const ignoreNextAimClickRef = useRef(false);
  const shakeTimerRef = useRef(null);
  const shakeForceRef = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    aimRef.current = aim;
  }, [aim]);

  const theme = getCurrentTheme(state);
  const hero = HEROES[config.classId];
  const currentNode = getCurrentNode(state);
  const currentLayer = getCurrentLayer(state);
  const levelLabel = currentLayer && currentNode
    ? `${currentLayer.name}-${MAP_CONFIG.nodeTypeNames[currentNode.type] || currentNode.type}`
    : "";
  const aliveEnemies = state.enemies.filter((enemy) => enemy.hp > 0);
  const selectedCard = state.player.hand.find((card) => card.instanceId === selectedCardId) || null;
  const validTargets = useMemo(() => getValidTargets(state, selectedCard), [state, selectedCard]);
  const needsTarget = selectedCard?.target === "enemy";
  const traitPreview = useMemo(() => {
    if (config.classId !== "macadamia") return null;
    const firstEnemy = aliveEnemies[0];
    if (!firstEnemy) return null;
    return TRAITS[firstEnemy.traitId] || null;
  }, [config.classId, aliveEnemies]);

  const getAimTargetAt = useCallback((x, y, card) => {
    const panel = document.elementFromPoint(x, y)?.closest("[data-enemy-id]");
    const enemyId = panel?.dataset.enemyId;
    if (!enemyId) return null;
    return getValidTargets(stateRef.current, card).includes(enemyId) ? enemyId : null;
  }, []);

  const updateAimPoint = useCallback(
    (x, y) => {
      const current = aimRef.current;
      if (!current) return;
      const targetId = getAimTargetAt(x, y, current.card);
      setAim((entry) =>
        entry
          ? {
              ...entry,
              pos: { x, y },
              moved: entry.moved || Math.hypot(x - entry.start.x, y - entry.start.y) > 6,
            }
          : null,
      );
      setAimTargetId(targetId);
    },
    [getAimTargetAt],
  );

  const clearAim = useCallback(() => {
    ignoreNextAimClickRef.current = false;
    setAim(null);
    setAimTargetId(null);
    setSelectedCardId(null);
  }, []);

  const handleCardMouseEnter = useCallback((card) => {
    setHoveredCardCost(card.cost);
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setHoveredCardCost(null);
  }, []);

  const showCardFlow = useCallback((kind, cards) => {
    const flows = cards.map((card, index) => ({
      id: `${kind}-${card.instanceId}-${Date.now()}-${index}`,
      card,
      kind,
      index,
    }));
    setCardFlows((current) => [...current, ...flows]);
    window.setTimeout(() => {
      setCardFlows((current) => current.filter((flow) => !flows.some((item) => item.id === flow.id)));
    }, 1250 + flows.length * 120);
  }, []);

  const triggerAvatarAction = useCallback((actorId) => {
    setAvatarActions((current) => ({ ...current, [actorId]: "attack" }));
    window.setTimeout(() => {
      setAvatarActions((current) => {
        const next = { ...current };
        delete next[actorId];
        return next;
      });
    }, 720);
  }, []);

  const appendFloaters = useCallback((target, text, tone) => {
    const key = target;
    const entry = { id: `${key}-${Date.now()}-${Math.random()}`, text, tone };
    setFloaters((current) => ({
      ...current,
      [key]: [...(current[key] || []), entry],
    }));
    window.setTimeout(() => {
      setFloaters((current) => ({
        ...current,
        [key]: (current[key] || []).filter((item) => item.id !== entry.id),
      }));
    }, 900);
  }, []);

  const appendHitFx = useCallback((target, effects) => {
    const id = `${target}-${Date.now()}-${Math.random()}`;
    setHitFx((current) => {
      const delay = Math.min((current[target]?.length || 0) * 140, 420);
      const entry = { id, effects, delay };
      return { ...current, [target]: [...(current[target] || []), entry] };
    });
    window.setTimeout(() => {
      setHitFx((current) => ({
        ...current,
        [target]: (current[target] || []).filter((entry) => entry.id !== id),
      }));
    }, 1300);
  }, []);

  const triggerScreenShake = useCallback((force = "soft") => {
    if (force !== "heavy" && shakeForceRef.current === "heavy") return;
    window.clearTimeout(shakeTimerRef.current);
    shakeForceRef.current = force;
    setScreenShake(null);
    window.requestAnimationFrame(() => {
      setScreenShake({ id: `${Date.now()}-${Math.random()}`, force });
      shakeTimerRef.current = window.setTimeout(() => {
        shakeForceRef.current = null;
        setScreenShake(null);
      }, force === "heavy" ? 320 : 240);
    });
  }, []);

  const handleReport = useCallback(
    (report) => {
      report.events.forEach((event) => {
        if (event.type === "floater") {
          appendFloaters(event.target, event.text, event.tone);
        }
        if (event.type === "banner") {
          setBanner({ ...event, id: `${Date.now()}-${Math.random()}` });
        }
        if (event.type === "shake") {
          triggerScreenShake(event.force);
        }
        if (event.type === "cardFlow") {
          showCardFlow(event.kind, event.cards);
        }
        if (event.type === "actorAction") {
          triggerAvatarAction(event.actorId);
        }
        if (event.type === "hitFx") {
          appendHitFx(event.target, event.effects);
          triggerScreenShake(event.effects.includes("hit") || event.effects.includes("break") ? "heavy" : "soft");
        }
      });
    },
    [appendFloaters, appendHitFx, showCardFlow, triggerAvatarAction, triggerScreenShake],
  );

  useEffect(
    () => () => {
      window.clearTimeout(shakeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!banner) {
      return undefined;
    }
    const timer = window.setTimeout(() => setBanner(null), 1100);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const startNewRun = useCallback((classId) => {
    const nextConfig = { classId, buildId: null };
    setConfig(nextConfig);
    const runState = createRunState(nextConfig);
    const layer = getCurrentLayer(runState);
    const node = getCurrentNode(runState);
    const encounter = makeEncounterFromNode(node, layer);
    setState(openEncounter(runState, layer, encounter, 0));
    setScreen("map");
  }, []);

  const restartRun = useCallback(() => {
    startNewRun(config.classId);
  }, [config, startNewRun]);

  const handleQuitRun = useCallback(() => {
    setShowQuitConfirm(false);
    setScreen("defeat-modal");
  }, []);

  const enterNode = useCallback(
    (node) => {
      if (!node.unlocked || isResolving) return;
      if (state.mapLinkMode) {
        if (!mapLinkFromId) {
          setMapLinkFromId(node.id);
          return;
        }
        const next = structuredClone(state);
        if (addMapLink(next, mapLinkFromId, node.id)) {
          next.mapLinkMode = false;
          setState(next);
          setMapLinkFromId(null);
        }
        return;
      }
      clearAim();
      setFloaters({});
      setHitFx({});
      setBanner(null);
      setIsResolving(false);

      const layer = state.layers[node.layerIndex];
      const next = { ...state, currentNodeId: node.id };

      if (node.type === "combat" || node.type === "elite" || node.type === "boss") {
        const encounter = makeEncounterFromNode(node, layer);
        setState(openEncounter(next, layer, encounter, 0));
        setScreen("combat");
        return;
      }

      if (node.type === "shop") {
        const withShop = structuredClone(next);
        ensureShop(withShop);
        setState(withShop);
        setScreen("shop");
        return;
      }
      setState(next);
      if (node.type === "event") setScreen("event");
      else if (node.type === "campfire") setScreen("campfire");
    },
    [clearAim, isResolving, mapLinkFromId, state],
  );

  const returnToMap = useCallback(() => {
    clearAim();
    setFloaters({});
    setHitFx({});
    setBanner(null);
    setIsResolving(false);
    setScreen("map");
  }, [clearAim]);

  const completeNodeAndReturn = useCallback((baseState = null) => {
    const current = baseState || stateRef.current;
    const currentNode = getCurrentNode(current);
    if (!currentNode) return;

    const next = { ...current };
    markNodeCleared(next, currentNode.id);

    if (isFinalBossNode(next, currentNode)) {
      setState(next);
      setScreen("victory-modal");
      return;
    }

    if (currentNode.type === "combat" || currentNode.type === "elite") {
      const rewardState = structuredClone(next);
      const reward = createCombatRewards(rewardState, currentNode.type);
      rewardState.player.glycogen += reward.glycogen;
      rewardState.rewardPending = reward;
      setState(rewardState);
      return;
    }

    if (currentNode.type === "boss") {
      advanceToLayer(next, next.layerIndex + 1);
      setState(next);
      setScreen("map");
      return;
    }

    unlockNextNodes(next, currentNode.id);
    setState(next);
    setScreen("map");
  }, []);

  const handleVictoryConfirm = useCallback(() => {
    const currentNode = getCurrentNode(state);
    if (isFinalBossNode(state, currentNode)) {
      setScreen("title");
      return;
    }
    completeNodeAndReturn();
  }, [completeNodeAndReturn, state]);

  const handleRewardPick = useCallback((cardKey) => {
    const next = structuredClone(state);
    if (!next.rewardPending) return;
    next.player.deckKeys.push(cardKey);
    next.rewardPending = null;
    unlockNextNodes(next, next.currentNodeId);
    setState(next);
    setScreen("map");
  }, [state]);

  const handleRewardSkip = useCallback(() => {
    const next = structuredClone(state);
    next.rewardPending = null;
    unlockNextNodes(next, next.currentNodeId);
    setState(next);
    setScreen("map");
  }, [state]);

  const handleBuyShopCard = useCallback((slotIndex) => {
    const next = structuredClone(state);
    if (buyShopCard(next, slotIndex)) setState(next);
  }, [state]);

  const handleBuyShopRelic = useCallback((slotIndex) => {
    const next = structuredClone(state);
    if (buyShopRelic(next, slotIndex)) setState(next);
  }, [state]);

  const handleDefeatConfirm = useCallback(() => {
    setScreen("title");
  }, []);

  const handleCampfireRest = useCallback(() => {
    const next = restAtCampfire({ ...state });
    setState(next);
    window.setTimeout(() => completeNodeAndReturn(next), 50);
  }, [completeNodeAndReturn, state]);

  const handleCampfireLeave = useCallback(() => {
    completeNodeAndReturn();
  }, [completeNodeAndReturn]);

  const handleQuit = useCallback(() => {
    if (window.electronAPI?.quit) {
      window.electronAPI.quit();
    } else {
      window.close();
    }
  }, []);

  const canPlaySelectedCard = useCallback(
    (card) => {
      if (!card || state.phase !== "player" || isResolving) {
        return false;
      }
      if (card.key === "trait-carousel" && state.player.traits.length < 2) {
        return false;
      }
      return state.player.energy >= card.cost;
    },
    [isResolving, state.phase, state.player.energy, state.player.traits.length],
  );

  const performCardPlay = useCallback(
    async (card, targetEnemyId = null) => {
      if (isResolving) {
        return;
      }
      setIsResolving(true);
      clearAim();
      const { nextState, report } = playCard(stateRef.current, card.instanceId, targetEnemyId);
      setState(nextState);
      handleReport(report);
      setHoveredCardCost(null);
      await wait(450);
      setIsResolving(false);

      if (nextState.phase === "victory") {
        window.setTimeout(() => completeNodeAndReturn(nextState), 500);
      } else if (nextState.phase === "defeat") {
        window.setTimeout(() => setScreen("defeat-modal"), 500);
      }
    },
    [clearAim, completeNodeAndReturn, handleReport, isResolving],
  );

  const releaseAim = useCallback(
    (x, y) => {
      const current = aimRef.current;
      if (!current) return;
      const targetId = getAimTargetAt(x, y, current.card);
      clearAim();
      if (targetId) {
        void performCardPlay(current.card, targetId);
      }
    },
    [clearAim, getAimTargetAt, performCardPlay],
  );

  const beginAim = useCallback(
    (card, event, mode) => {
      if (card.target !== "enemy" || !canPlaySelectedCard(card)) return false;
      const rect = event.currentTarget.getBoundingClientRect();
      const point = { x: event.clientX, y: event.clientY };
      setSelectedCardId(card.instanceId);
      setHoveredCardCost(card.cost);
      setAim({
        card,
        mode,
        origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        pos: point,
        start: point,
        moved: false,
      });
      setAimTargetId(getAimTargetAt(point.x, point.y, card));
      return true;
    },
    [canPlaySelectedCard, getAimTargetAt],
  );

  const onCardPointerDown = useCallback(
    (card, event) => {
      if (event.button !== 0 || card.target !== "enemy" || !beginAim(card, event, "drag")) return;
      event.preventDefault();
      event.stopPropagation();
    },
    [beginAim],
  );

  const onCardClick = useCallback(
    (card, event) => {
      if (!canPlaySelectedCard(card)) {
        return;
      }
      if (card.target === "enemy") {
        event?.preventDefault();
        event?.stopPropagation();
        return;
      }
      void performCardPlay(card, null);
    },
    [canPlaySelectedCard, performCardPlay],
  );

  useEffect(() => {
    const onPointerMove = (event) => {
      const current = aimRef.current;
      if (!current) return;
      updateAimPoint(event.clientX, event.clientY);
    };

    const onPointerUp = (event) => {
      const current = aimRef.current;
      if (!current || current.mode !== "drag") return;
      const targetId = getAimTargetAt(event.clientX, event.clientY, current.card);
      if (targetId) {
        releaseAim(event.clientX, event.clientY);
        return;
      }
      if (Math.hypot(event.clientX - current.start.x, event.clientY - current.start.y) <= 6) {
        ignoreNextAimClickRef.current = true;
        window.setTimeout(() => {
          ignoreNextAimClickRef.current = false;
        }, 0);
        setAim((entry) => (entry ? { ...entry, mode: "attached", pos: { x: event.clientX, y: event.clientY } } : null));
        setAimTargetId(null);
        return;
      }
      clearAim();
    };

    const onClick = (event) => {
      const current = aimRef.current;
      if (!current || current.mode !== "attached") return;
      event.preventDefault();
      event.stopPropagation();
      if (ignoreNextAimClickRef.current) {
        ignoreNextAimClickRef.current = false;
        return;
      }
      releaseAim(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("click", onClick, true);
    };
  }, [clearAim, getAimTargetAt, releaseAim, updateAimPoint]);

  const onEnemyTarget = useCallback(
    (enemyId) => {
      if (!selectedCard || !validTargets.includes(enemyId) || isResolving) {
        return;
      }
      void performCardPlay(selectedCard, enemyId);
    },
    [isResolving, performCardPlay, selectedCard, validTargets],
  );

  const handleEndTurn = useCallback(async () => {
    if (state.phase !== "player" || isResolving) {
      return;
    }
    setIsResolving(true);
    const endResult = endPlayerTurn(stateRef.current);
    setState(endResult.nextState);
    handleReport(endResult.report);
    clearAim();
    setHoveredCardCost(null);
    await wait(500);

    let workingState = endResult.nextState;
    for (const enemy of workingState.enemies.filter((entry) => entry.hp > 0)) {
      const result = resolveEnemyAction(workingState, enemy.instanceId);
      workingState = result.nextState;
      setState(workingState);
      handleReport(result.report);
      await wait(650);
      if (workingState.phase === "victory" || workingState.phase === "defeat") {
        setIsResolving(false);
        if (workingState.phase === "victory") {
          window.setTimeout(() => completeNodeAndReturn(workingState), 900);
        } else {
          window.setTimeout(() => setScreen("defeat-modal"), 900);
        }
        return;
      }
    }

    const startResult = startNextPlayerTurn(workingState);
    setState(startResult.nextState);
    handleReport(startResult.report);
    await wait(450);
    setIsResolving(false);
  }, [clearAim, completeNodeAndReturn, handleReport, isResolving, state.phase]);

  const renderTitle = () => (
    <TitleScreen onNewGame={() => setScreen("hero-select")} onQuit={handleQuit} />
  );

  const renderHeroSelect = () => (
    <HeroSelectScreen
      onConfirm={(classId) => startNewRun(classId)}
      onBack={() => setScreen("title")}
    />
  );

  const renderMap = () => (
    <MapScreen state={state} onNodeClick={enterNode} mapLinkFromId={mapLinkFromId} />
  );

  const renderNonCombat = () => {
    if (screen === "shop") {
      return (
        <ShopScreen
          state={state}
          onBuyCard={handleBuyShopCard}
          onBuyRelic={handleBuyShopRelic}
          onLeave={completeNodeAndReturn}
        />
      );
    }
    if (screen === "event") return <EventScreen state={state} onLeave={completeNodeAndReturn} />;
    if (screen === "campfire")
      return (
        <CampfireScreen
          state={state}
          onRest={handleCampfireRest}
          onLeave={handleCampfireLeave}
        />
      );
    return null;
  };

  const renderCombat = () => {
    return (
      <div
        className={`app-shell ${screenShake ? `is-shaking is-shaking--${screenShake.force || "soft"}` : ""}`}
        style={{
          "--theme-accent": theme.accent,
          "--theme-surface": theme.surface,
        }}
      >
        <header className="top-strip">
          <div className="top-strip__brand">
            <span className="level-badge">{levelLabel}</span>
          </div>
          <div className="top-strip__meta">
            <button
              type="button"
              className="meta-chip meta-chip--button"
              onClick={() => setShowMapOverlay(true)}
              disabled={isResolving}
            >
              <Map size={14} />
              <span>显示地图</span>
            </button>
            <QuitRunButton onClick={() => setShowQuitConfirm(true)} disabled={isResolving} />
          </div>
        </header>

        <main className="main-grid main-grid--combat">
          <section className="battle-column">
            <div className="battle-surface">
              <div className="battle-surface__copy">
                {needsTarget && (
                  <div className="target-callout">
                    <span>{aim?.mode === "attached" ? "点击目标释放" : "拖到敌人身上释放"}</span>
                    <strong>{selectedCard?.name}</strong>
                  </div>
                )}
              </div>

              <div className="battle-arena">
                <div className="battle-arena__side battle-arena__side--player">
                  <div className="player-combat-card">
                    <FxFloaters floaters={floaters.player} />
                    <BattleAvatar
                      isPlayer
                      classId={config.classId}
                      color={hero.accent}
                      glyph={hero.glyph}
                      label={hero.name}
                      action={avatarActions.player}
                      plain
                    />
                    <HitFxLayer effects={hitFx.player} />
                    <div className="player-combat-card__info">
                      <StatChip icon={Heart} label="HP" value={`${state.player.hp}/${state.player.maxHp}`} />
                      <StatChip icon={Shield} label="格挡" value={state.player.block} />
                    </div>
                  </div>

                  {state.player.classId === "enoki" ? (
                    <MiniColony
                      minis={state.player.minis}
                      floaters={floaters}
                      hitFx={hitFx}
                      avatarActions={avatarActions}
                    />
                  ) : (
                    <TraitRack player={state.player} />
                  )}
                </div>

                <div className="battle-arena__vs">
                  <span>VS</span>
                  <div className="battle-arena__turn">
                    {state.phase === "player" && "你的回合"}
                    {state.phase === "enemy" && "敌方回合"}
                    {state.phase === "victory" && "胜利"}
                    {state.phase === "defeat" && "失败"}
                  </div>
                </div>

                <div className="battle-arena__side battle-arena__side--enemies">
                  {aliveEnemies.map((enemy) => (
                    <EnemyPanel
                      key={enemy.instanceId}
                      enemy={enemy}
                      onTarget={() => onEnemyTarget(enemy.instanceId)}
                      targeted={aimTargetId === enemy.instanceId}
                      floaters={floaters}
                      hitFx={hitFx}
                      action={avatarActions[enemy.instanceId]}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="battle-energy">
              <span className="energy-gem battle-energy__gem" aria-hidden="true" />
              <strong>{state.player.energy}</strong>
              {hoveredCardCost !== null && (
                <span className="battle-energy__preview">-{hoveredCardCost}</span>
              )}
              <span>/ {state.player.maxEnergy}</span>
            </div>

            <div className="hand-band">
              <div className="hand-band__hud hand-band__hud--left">
                <PileButton type="deck" count={state.player.deck.length} />
              </div>

              <div className="hand-band__center">
                <div className="hand-band__toolbar">
                  <div className="hand-band__title">
                    <span className="eyebrow">手牌区</span>
                    <strong>
                      {state.phase === "player"
                        ? `当前手牌 ${state.player.hand.length} 张`
                        : state.phase === "victory"
                        ? "遭遇已清空"
                        : state.phase === "defeat"
                        ? "本轮结束"
                        : "敌方动作中"}
                    </strong>
                  </div>
                  <div className="hand-band__actions">
                    {state.phase === "player" && (
                      <button
                        type="button"
                        className="action-button"
                        onClick={handleEndTurn}
                        disabled={isResolving}
                      >
                        <FastForward size={16} />
                        <span>结束回合</span>
                      </button>
                    )}
                  </div>
                </div>
                <HandFan
                  cards={state.player.hand}
                  selectedCardId={selectedCardId}
                  aimingCardId={aim?.card.instanceId}
                  canPlayCard={canPlaySelectedCard}
                  onCardClick={onCardClick}
                  onCardPointerDown={onCardPointerDown}
                  onCardMouseEnter={handleCardMouseEnter}
                  onCardMouseLeave={handleCardMouseLeave}
                  traitPreview={traitPreview}
                />
              </div>

              <div className="hand-band__hud hand-band__hud--right">
                <PileButton type="discard" count={state.player.discard.length} onClick={() => setDiscardOpen(true)} />
              </div>
            </div>
          </section>
        </main>

        {showMapOverlay && (
          <div className="map-overlay" onClick={() => setShowMapOverlay(false)}>
            <div className="map-overlay__card" onClick={(e) => e.stopPropagation()}>
              <MapScreen state={state} onNodeClick={() => {}} />
            </div>
          </div>
        )}

        {banner && (
          <div className={`banner banner--${banner.tone}`}>
            <strong>{banner.label}</strong>
            {banner.sublabel && <span>{banner.sublabel}</span>}
          </div>
        )}
        <CardFlowLayer flows={cardFlows} />
        <AimLayer aim={aim} traitPreview={traitPreview} />
        {discardOpen && <DiscardModal cards={state.player.discard} onClose={() => setDiscardOpen(false)} />}
      </div>
    );
  };

  let content;
  switch (screen) {
    case "title":
      content = renderTitle();
      break;
    case "hero-select":
      content = renderHeroSelect();
      break;
    case "map":
    case "shop":
    case "event":
    case "campfire":
      content = (
        <div
          className="app-shell"
          style={{
            "--theme-accent": theme.accent,
            "--theme-surface": theme.surface,
          }}
        >
          <header className="top-strip">
            <div className="top-strip__brand">
              <span className="eyebrow">DBG Demo</span>
              <h1>The Indigestibles</h1>
            </div>
            <div className="top-strip__meta">
              <QuitRunButton onClick={() => setShowQuitConfirm(true)} />
            </div>
          </header>
          <main className="main-grid main-grid--fullscreen">{screen === "map" ? renderMap() : renderNonCombat()}</main>
        </div>
      );
      break;
    case "combat":
      content = renderCombat();
      break;
    case "victory-modal":
      content = <VictoryModal state={state} onConfirm={handleVictoryConfirm} />;
      break;
    case "defeat-modal":
      content = <DefeatModal onConfirm={handleDefeatConfirm} />;
      break;
    default:
      content = renderTitle();
  }

  return (
    <>
      {content}
      <RewardChoiceModal reward={state.rewardPending} onPick={handleRewardPick} onSkip={handleRewardSkip} />
      {showQuitConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <strong>结束这段肠旅</strong>
            <p>确定要放弃当前进度并进入结算吗？</p>
            <div className="modal-card__actions">
              <button type="button" className="action-button" onClick={handleQuitRun}>
                确认
              </button>
              <button
                type="button"
                className="action-button action-button--ghost"
                onClick={() => setShowQuitConfirm(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
