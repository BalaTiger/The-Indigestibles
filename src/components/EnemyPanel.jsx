import React from "react";
import { Heart, Shield, Sword } from "lucide-react";
import { BattleAvatar } from "./BattleAvatar";
import { FxFloaters } from "./FxLayer";
import { StatChip } from "./StatChip";
import { FanSwordsIcon } from "./FanSwordsIcon";
import { TRAITS } from "../data/content";

function intentTone(intent) {
  if (!intent) return "neutral";
  if (intent.type === "guard") return "guard";
  if (intent.type === "attackAll" || intent.type === "miniSweep") return "burst";
  return "attack";
}

function renderIntentIcon(intent) {
  const tone = intentTone(intent);
  if (tone === "guard") return <Shield size={26} />;
  if (tone === "burst") return <FanSwordsIcon size={26} />;
  return <Sword size={26} />;
}

function makeTargetKey(kind, id) {
  return `${kind}:${id}`;
}

export function EnemyPanel({ enemy, onTarget, targeted, floaters, action }) {
  const trait = TRAITS[enemy.traitId];

  return (
    <button
      type="button"
      className={`enemy-panel enemy-panel--horizontal ${targeted ? "is-targeted" : ""}`}
      onClick={onTarget}
      style={{ "--trait-color": trait?.color || "#cda16d" }}
    >
      <FxFloaters floaters={floaters[makeTargetKey("enemy", enemy.instanceId)]} />

      <div className="enemy-panel__avatar-wrap">
        <div className={`enemy-panel__intent enemy-panel__intent--${intentTone(enemy.intent)}`}>
          {renderIntentIcon(enemy.intent)}
        </div>
        <BattleAvatar
          isPlayer={false}
          traitId={enemy.traitId}
          color={trait?.color}
          glyph={enemy.glyph}
          label={enemy.name}
          targeted={targeted}
          action={action}
          plain
        />
      </div>

      <div className="enemy-panel__body">
        <div className="enemy-panel__stats">
          <StatChip icon={Heart} label="HP" value={`${enemy.hp}/${enemy.maxHp}`} />
          <StatChip icon={Shield} label="格挡" value={enemy.block} />
        </div>
      </div>
    </button>
  );
}
