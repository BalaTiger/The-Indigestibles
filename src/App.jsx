import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FastForward,
  Leaf,
  RotateCcw,
  Shell,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react";
import { HEROES, LARGE_BOSS_POOL, TRAITS } from "./data/content";
import {
  continueRun,
  createDemoState,
  endPlayerTurn,
  getBuildInfo,
  getCurrentTheme,
  getValidTargets,
  playCard,
  resolveEnemyAction,
  startNextPlayerTurn,
} from "./game/engine";
import { HandFan } from "./components/HandFan";
import { FxFloaters } from "./components/FxLayer";

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function intentTone(intent) {
  if (!intent) return "neutral";
  if (intent.type === "guard") return "guard";
  if (intent.type === "attackAll" || intent.type === "miniSweep") return "burst";
  return "attack";
}

function makeTargetKey(kind, id) {
  return `${kind}:${id}`;
}

function classIcon(classId) {
  return classId === "enoki" ? Leaf : Shell;
}

function Portrait({ glyph, accent, label }) {
  return (
    <div className="portrait" style={{ "--portrait-accent": accent }}>
      <div className="portrait__glyph">{glyph}</div>
      <div className="portrait__label">{label}</div>
    </div>
  );
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

function RunTrack({ state }) {
  return (
    <div className="run-track">
      {state.layers.map((layer, layerIndex) => (
        <div key={layer.id} className={`run-track__layer ${layerIndex === state.layerIndex ? "is-current" : ""}`}>
          <div className="run-track__head">
            <span>{layer.name}</span>
            <small>{layer.subtitle}</small>
          </div>
          <div className="run-track__nodes">
            {layer.encounters.map((encounter, encounterIndex) => {
              const done =
                layerIndex < state.layerIndex ||
                (layerIndex === state.layerIndex && encounterIndex < state.encounterIndex);
              const current = layerIndex === state.layerIndex && encounterIndex === state.encounterIndex;
              return (
                <div
                  key={encounter.id}
                  className={`run-track__node ${done ? "is-done" : ""} ${current ? "is-active" : ""} ${
                    encounter.boss ? "is-boss" : ""
                  }`}
                >
                  <span>{encounter.boss ? "B" : "·"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Sidebar({
  state,
  config,
  onClassChange,
  onBuildChange,
  onRestart,
}) {
  const hero = HEROES[config.classId];
  const build = hero.builds[config.buildId];

  return (
    <aside className="side-rail">
      <section className="rail-section">
        <div className="rail-title">宿主选择</div>
        <div className="segmented">
          {Object.values(HEROES).map((candidate) => {
            const Icon = classIcon(candidate.id);
            return (
              <button
                key={candidate.id}
                type="button"
                className={`segment ${candidate.id === config.classId ? "is-active" : ""}`}
                onClick={() => onClassChange(candidate.id)}
              >
                <Icon size={16} />
                <span>{candidate.name}</span>
              </button>
            );
          })}
        </div>
        <div className="segmented segmented--builds">
          {Object.values(hero.builds).map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={`segment ${candidate.id === config.buildId ? "is-active" : ""}`}
              onClick={() => onBuildChange(candidate.id)}
            >
              <span>{candidate.name}</span>
            </button>
          ))}
        </div>
        <div className="hero-copy">
          <strong>{hero.summary}</strong>
          <p>{hero.mechanic}</p>
          <p>{build.passive}</p>
          <p>{build.vibe}</p>
        </div>
        <button type="button" className="action-button" onClick={onRestart}>
          <RotateCcw size={16} />
          <span>重开这趟肠旅</span>
        </button>
      </section>

      <section className="rail-section">
        <div className="rail-title">本轮路线</div>
        <RunTrack state={state} />
      </section>

      <section className="rail-section">
        <div className="rail-title">大肠 Boss 池</div>
        <div className="boss-pool">
          {LARGE_BOSS_POOL.map((bossId) => (
            <div key={bossId} className={`boss-chip ${bossId === state.finalBossId ? "is-active" : ""}`}>
              {bossId === "mr-hemorrhoid" && "痔疮先生"}
              {bossId === "constipation-idol" && "便秘偶像"}
              {bossId === "gas-duke" && "胀气公爵"}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function EnemyPanel({ enemy, onTarget, targeted, floaters }) {
  return (
    <button
      type="button"
      className={`enemy-panel ${targeted ? "is-targeted" : ""}`}
      onClick={onTarget}
    >
      <FxFloaters floaters={floaters[makeTargetKey("enemy", enemy.instanceId)]} />
      <Portrait glyph={enemy.glyph} accent={TRAITS[enemy.traitId]?.color || "#cda16d"} label={enemy.name} />
      <div className="enemy-panel__stats">
        <div>
          <strong>{enemy.hp}</strong>
          <span>/ {enemy.maxHp}</span>
        </div>
        <div>格挡 {enemy.block}</div>
      </div>
      <div className={`intent-badge intent-badge--${intentTone(enemy.intent)}`}>
        <span>{enemy.intent.label}</span>
        <small>
          {enemy.intent.type === "guard"
            ? `+${enemy.intent.value} 壳`
            : enemy.intent.type === "attackAll"
            ? `${enemy.intent.value} / 全体`
            : enemy.intent.type === "miniSweep"
            ? `${enemy.intent.value} / 菌群`
            : `${enemy.intent.value ?? enemy.intent.guard ?? 0}`}
        </small>
      </div>
      <div className="enemy-panel__trait" style={{ "--trait-color": TRAITS[enemy.traitId]?.color || "#d6a97f" }}>
        <span>{TRAITS[enemy.traitId]?.short}</span>
        <div>
          <strong>{TRAITS[enemy.traitId]?.name}</strong>
          <small>{TRAITS[enemy.traitId]?.description}</small>
        </div>
      </div>
    </button>
  );
}

export default function App() {
  const [config, setConfig] = useState({
    classId: "enoki",
    buildId: "guardian",
  });
  const [state, setState] = useState(() => createDemoState(config));
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [floaters, setFloaters] = useState({});
  const [banner, setBanner] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [shakeToken, setShakeToken] = useState(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const theme = getCurrentTheme(state);
  const hero = HEROES[config.classId];
  const build = getBuildInfo(config.classId, config.buildId);
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

  const resetWithConfig = useCallback(
    (nextConfig) => {
      setConfig(nextConfig);
      setSelectedCardId(null);
      setFloaters({});
      setBanner(null);
      setIsResolving(false);
      setState(createDemoState(nextConfig));
    },
    [],
  );

  const handleClassChange = useCallback(
    (classId) => {
      const buildId = Object.keys(HEROES[classId].builds)[0];
      resetWithConfig({ classId, buildId });
    },
    [resetWithConfig],
  );

  const handleBuildChange = useCallback(
    (buildId) => {
      resetWithConfig({ ...config, buildId });
    },
    [config, resetWithConfig],
  );

  const handleRestart = useCallback(() => {
    resetWithConfig(config);
  }, [config, resetWithConfig]);

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
    },
    [handleReport, isResolving],
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
        return;
      }
    }

    const startResult = startNextPlayerTurn(workingState);
    setState(startResult.nextState);
    handleReport(startResult.report);
    await wait(450);
    setIsResolving(false);
  }, [handleReport, isResolving, state.phase]);

  const handleContinue = useCallback(() => {
    setSelectedCardId(null);
    setState((current) => continueRun(current));
  }, []);

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
          <div className="meta-chip">
            <Leaf size={14} />
            <span>{state.currentEncounter?.layerName}</span>
          </div>
          <div className="meta-chip">
            <Sparkles size={14} />
            <span>{state.currentEncounter?.name}</span>
          </div>
          <div className="meta-chip">
            <Shield size={14} />
            <span>HP {state.player.hp}/{state.player.maxHp}</span>
          </div>
          <div className="meta-chip">
            <Swords size={14} />
            <span>能量 {state.player.energy}</span>
          </div>
        </div>
      </header>

      <main className="main-grid">
        <Sidebar
          state={state}
          config={config}
          onClassChange={handleClassChange}
          onBuildChange={handleBuildChange}
          onRestart={handleRestart}
        />

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

            <div className="enemy-row">
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

            <div className="player-stage">
              <div className="player-panel">
                <FxFloaters floaters={floaters.player} />
                <div className="player-panel__top">
                  <Portrait glyph={hero.glyph} accent={hero.accent} label={hero.name} />
                  <div className="player-panel__summary">
                    <div className="player-panel__name">
                      <strong>{hero.name}</strong>
                      <span>{build.name}</span>
                    </div>
                    <p>{build.passive}</p>
                    <div className="player-panel__stats">
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
            </div>
          </div>

          <div className="hand-band">
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
                  <button type="button" className="action-button" onClick={handleEndTurn} disabled={isResolving}>
                    <FastForward size={16} />
                    <span>结束回合</span>
                  </button>
                )}
                {(state.phase === "victory" || state.phase === "runComplete") && (
                  <button type="button" className="action-button" onClick={handleContinue}>
                    <FastForward size={16} />
                    <span>{state.phase === "runComplete" ? "查看通关状态" : "继续下探"}</span>
                  </button>
                )}
                {state.phase === "defeat" && (
                  <button type="button" className="action-button" onClick={handleRestart}>
                    <RotateCcw size={16} />
                    <span>重新开局</span>
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
        </section>

        <aside className="side-rail side-rail--right">
          <section className="rail-section">
            <div className="rail-title">战斗摘要</div>
            <div className="summary-grid">
              <div className="summary-cell">
                <span>层数</span>
                <strong>{state.layerIndex + 1} / 3</strong>
              </div>
              <div className="summary-cell">
                <span>遭遇</span>
                <strong>{state.encounterIndex + 1}</strong>
              </div>
              <div className="summary-cell">
                <span>回合</span>
                <strong>{state.turn}</strong>
              </div>
              <div className="summary-cell">
                <span>状态</span>
                <strong>
                  {state.phase === "player" && "你在动"}
                  {state.phase === "enemy" && "肠道在动"}
                  {state.phase === "victory" && "打完了"}
                  {state.phase === "defeat" && "被消化了"}
                  {state.phase === "runComplete" && "通关了"}
                </strong>
              </div>
            </div>
          </section>

          <section className="rail-section">
            <div className="rail-title">机制镜头</div>
            {state.player.classId === "enoki" ? (
              <div className="detail-copy">
                <p>成熟小金针菇数量：{state.player.minis.filter((mini) => mini.ready).length}</p>
                <p>已损失分身：{state.player.deadMinis}</p>
                <p>护伞拦截层数：{state.player.status.bodyguardHits}</p>
                <p>菌葬替死层数：{state.player.status.decoyReady}</p>
              </div>
            ) : (
              <div className="detail-copy">
                <p>当前壳芯：{state.player.currentTraitId ? TRAITS[state.player.currentTraitId].name : "空"}</p>
                <p>专精层数：{state.player.focusChain || 0}</p>
                <p>储存特性数：{state.player.traits.length}</p>
                <p>反弹层：{state.player.status.retaliate}</p>
              </div>
            )}
          </section>

          <section className="rail-section rail-section--log">
            <div className="rail-title">肠道播报</div>
            <div className="log-feed">
              {[...state.log].reverse().map((entry, index) => (
                <div key={`${index}-${entry}`} className="log-line">
                  {entry}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>

      {banner && (
        <div className={`banner banner--${banner.tone}`}>
          <strong>{banner.label}</strong>
          {banner.sublabel && <span>{banner.sublabel}</span>}
        </div>
      )}
    </div>
  );
}
