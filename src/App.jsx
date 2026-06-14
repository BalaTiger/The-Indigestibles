import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FastForward, Leaf, Map, RotateCcw, Shield, Shell, Sparkles, Swords } from "lucide-react";
import { HEROES, TRAITS } from "./data/content";
import {
  advanceToLayer,
  createRunState,
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
import { FxFloaters } from "./components/FxLayer";
import { EnemyPanel } from "./components/EnemyPanel";
import { BattleAvatar } from "./components/BattleAvatar";
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

function classIcon(classId) {
  return classId === "enoki" ? Leaf : Shell;
}

function MiniColony({ minis, floaters }) {
  return (
    <div className="mini-colony">
      {minis.length ? (
        minis.map((mini) => (
          <div key={mini.id} className={`mini-unit ${mini.ready ? "is-ready" : ""}`}>
            <FxFloaters floaters={floaters[makeTargetKey("mini", mini.id)]} />
            <div className="mini-unit__cap" />
            <div className="mini-unit__meta">
              <span>HP {mini.hp}</span>
              <span>G {mini.growth}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="mini-colony__empty">还没有小金针菇落地。</div>
      )}
    </div>
  );
}

function TraitRack({ player, buildId }) {
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
              <span className="trait-chip__count">
                {buildId === "focus" ? `专精 ${player.focusChain || 1}` : `储层 ${entry.stacks}`}
              </span>
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
    buildId: "guardian",
  });
  const [state, setState] = useState(() => createRunState(config));
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [floaters, setFloaters] = useState({});
  const [banner, setBanner] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [shakeToken, setShakeToken] = useState(0);
  const [showMapOverlay, setShowMapOverlay] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const theme = getCurrentTheme(state);
  const hero = HEROES[config.classId];
  const build = hero.builds[config.buildId];
  const aliveEnemies = state.enemies.filter((enemy) => enemy.hp > 0);
  const selectedCard = state.player.hand.find((card) => card.instanceId === selectedCardId) || null;
  const validTargets = useMemo(() => getValidTargets(state, selectedCard), [state, selectedCard]);
  const needsTarget = selectedCard?.target === "enemy";

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
          setShakeToken((token) => token + 1);
        }
      });
    },
    [appendFloaters],
  );

  useEffect(() => {
    if (!banner) {
      return undefined;
    }
    const timer = window.setTimeout(() => setBanner(null), 1100);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const startNewRun = useCallback((classId, buildId) => {
    const nextConfig = { classId, buildId };
    setConfig(nextConfig);
    const runState = createRunState(nextConfig);
    const layer = getCurrentLayer(runState);
    const node = getCurrentNode(runState);
    const encounter = makeEncounterFromNode(node, layer);
    setState(openEncounter(runState, layer, encounter, 0));
    setScreen("map");
  }, []);

  const restartRun = useCallback(() => {
    startNewRun(config.classId, config.buildId);
  }, [config, startNewRun]);

  const enterNode = useCallback(
    (node) => {
      if (!node.unlocked || isResolving) return;
      setSelectedCardId(null);
      setFloaters({});
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

      setState(next);
      if (node.type === "shop") setScreen("shop");
      else if (node.type === "event") setScreen("event");
      else if (node.type === "campfire") setScreen("campfire");
    },
    [isResolving, state],
  );

  const returnToMap = useCallback(() => {
    setSelectedCardId(null);
    setFloaters({});
    setBanner(null);
    setIsResolving(false);
    setScreen("map");
  }, []);

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
      const { nextState, report } = playCard(stateRef.current, card.instanceId, targetEnemyId);
      setState(nextState);
      handleReport(report);
      setSelectedCardId(null);
      await wait(450);
      setIsResolving(false);

      if (nextState.phase === "victory") {
        window.setTimeout(() => completeNodeAndReturn(nextState), 500);
      } else if (nextState.phase === "defeat") {
        window.setTimeout(() => setScreen("defeat-modal"), 500);
      }
    },
    [completeNodeAndReturn, handleReport, isResolving],
  );

  const onCardClick = useCallback(
    (card) => {
      if (!canPlaySelectedCard(card)) {
        return;
      }
      if (card.target === "enemy") {
        setSelectedCardId((current) => (current === card.instanceId ? null : card.instanceId));
        return;
      }
      void performCardPlay(card, null);
    },
    [canPlaySelectedCard, performCardPlay],
  );

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
    setSelectedCardId(null);
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
  }, [completeNodeAndReturn, handleReport, isResolving, state.phase]);

  const renderTitle = () => (
    <TitleScreen onNewGame={() => setScreen("hero-select")} onQuit={handleQuit} />
  );

  const renderHeroSelect = () => (
    <HeroSelectScreen
      onConfirm={(classId, buildId) => startNewRun(classId, buildId)}
      onBack={() => setScreen("title")}
    />
  );

  const renderMap = () => (
    <MapScreen state={state} onNodeClick={enterNode} />
  );

  const renderNonCombat = () => {
    if (screen === "shop") return <ShopScreen state={state} onLeave={completeNodeAndReturn} />;
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
    const ClassIcon = classIcon(config.classId);

    return (
      <div
        className={`app-shell ${shakeToken % 2 === 1 ? "is-shaking" : ""}`}
        style={{
          "--theme-accent": theme.accent,
          "--theme-surface": theme.surface,
        }}
      >
        <header className="top-strip">
          <div className="top-strip__brand">
            <span className="eyebrow">DBG Demo</span>
            <h1>The Indigestibles</h1>
            <p>仿《杀戮尖塔》的胃肠道探险原型。当前先把职业机制、手牌手感和三层流程跑起来。</p>
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
            <button
              type="button"
              className="meta-chip meta-chip--button"
              onClick={restartRun}
              disabled={isResolving}
            >
              <RotateCcw size={14} />
              <span>重开这趟肠旅</span>
            </button>
          </div>
        </header>

        <main className="main-grid main-grid--combat">
          <section className="battle-column">
            <div className="battle-surface">
              <div className="battle-surface__copy">
                <div>
                  <span className="eyebrow">当前遭遇</span>
                  <h2>{state.currentEncounter?.name}</h2>
                  <p>{state.currentEncounter?.note}</p>
                </div>
                {needsTarget && (
                  <div className="target-callout">
                    <span>点击敌人来打出</span>
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
                    />
                    <div className="player-combat-card__info">
                      <div className="player-combat-card__name">
                        <strong>{hero.name}</strong>
                        <span>{build.name}</span>
                      </div>
                      <div className="player-combat-card__stats">
                        <span>格挡 {state.player.block}</span>
                        <span>弃牌 {state.player.discard.length}</span>
                        <span>牌库 {state.player.deck.length}</span>
                      </div>
                    </div>
                  </div>

                  {state.player.classId === "enoki" ? (
                    <MiniColony minis={state.player.minis} floaters={floaters} />
                  ) : (
                    <TraitRack player={state.player} buildId={config.buildId} />
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
                      targeted={validTargets.includes(enemy.instanceId) && needsTarget}
                      floaters={floaters}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="hand-band">
              <div className="hand-band__hud hand-band__hud--left">
                <div className="hud-chip">
                  <Shield size={18} />
                  <div>
                    <span>HP</span>
                    <strong>{state.player.hp}/{state.player.maxHp}</strong>
                  </div>
                </div>
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
                  canPlayCard={canPlaySelectedCard}
                  onCardClick={onCardClick}
                />
              </div>

              <div className="hand-band__hud hand-band__hud--right">
                <div className="hud-chip">
                  <Swords size={18} />
                  <div>
                    <span>能量</span>
                    <strong>{state.player.energy}/{state.player.maxEnergy}</strong>
                  </div>
                </div>
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
              <button
                type="button"
                className="meta-chip meta-chip--button"
                onClick={() => setScreen("title")}
              >
                <span>返回主界面</span>
              </button>
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

  return content;
}
