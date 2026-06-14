import React from "react";
import { BattleAvatar } from "./BattleAvatar";
import { FxFloaters } from "./FxLayer";
import { TRAITS } from "../data/content";

function intentTone(intent) {
  if (!intent) return "neutral";
  if (intent.type === "guard") return "guard";
  if (intent.type === "attackAll" || intent.type === "miniSweep") return "burst";
  return "attack";
}

function makeTargetKey(kind, id) {
  return `${kind}:${id}`;
}

export function EnemyPanel({ enemy, onTarget, targeted, floaters }) {
  const trait = TRAITS[enemy.traitId];

  return (
    <button
      type="button"
      className={`enemy-panel enemy-panel--horizontal ${targeted ? "is-targeted" : ""}`}
      onClick={onTarget}
      style={{ "--trait-color": trait?.color || "#cda16d" }}
    >
      <FxFloaters floaters={floaters[makeTargetKey("enemy", enemy.instanceId)]} />
      <BattleAvatar
        isPlayer={false}
        traitId={enemy.traitId}
        color={trait?.color}
        glyph={enemy.glyph}
        label={enemy.name}
        targeted={targeted}
      />

      <div className="enemy-panel__body">
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

        <div className="enemy-panel__trait">
          <span>{trait?.short}</span>
          <div>
            <strong>{trait?.name}</strong>
            <small>{trait?.description}</small>
          </div>
        </div>
      </div>
    </button>
  );
}
