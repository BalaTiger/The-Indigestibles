import React, { useEffect, useState } from "react";

function useShowcaseAttack(enabled) {
  const [attacking, setAttacking] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let timer;
    let alive = true;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!alive) return;
        setAttacking(true);
        window.setTimeout(() => setAttacking(false), 720);
        schedule();
      }, 3000 + Math.random() * 3000);
    };
    schedule();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [enabled]);

  return attacking;
}

function EnokiFigure() {
  return (
    <svg viewBox="0 0 160 180" className="battle-avatar__svg">
      <g className="avatar-shadow"><ellipse cx="80" cy="158" rx="48" ry="10" /></g>
      <g className="avatar-body avatar-body--enoki">
        <path className="avatar-limb avatar-limb--left" d="M63 103 C48 118 39 137 32 160" />
        <path className="avatar-limb avatar-limb--right" d="M97 103 C112 118 121 137 128 160" />
        <path className="avatar-limb avatar-limb--thin-left" d="M73 111 C67 128 63 147 58 168" />
        <path className="avatar-limb avatar-limb--thin-right" d="M87 111 C93 128 97 147 102 168" />
        <path className="avatar-stem" d="M65 59 C54 86 57 125 69 150 C74 161 86 161 91 150 C103 124 106 86 95 59 Z" />
        <path className="avatar-cap" d="M31 58 C40 25 67 15 84 21 C105 13 133 30 136 60 C112 74 58 76 31 58 Z" />
        <path className="avatar-cap-mark" d="M50 51 C66 43 96 43 116 52" />
        <circle className="avatar-eye" cx="68" cy="78" r="4" />
        <circle className="avatar-eye" cx="91" cy="78" r="4" />
      </g>
    </svg>
  );
}

function MiniEnokiFigure() {
  return (
    <svg viewBox="0 0 120 120" className="battle-avatar__svg">
      <g className="avatar-shadow"><ellipse cx="60" cy="106" rx="30" ry="7" /></g>
      <g className="avatar-body avatar-body--mini">
        <path className="avatar-stem" d="M50 45 C43 66 46 91 55 103 C59 108 65 108 69 103 C78 91 80 66 70 45 Z" />
        <path className="avatar-cap" d="M27 47 C34 25 51 18 62 22 C76 16 95 29 97 49 C78 60 45 60 27 47 Z" />
        <circle className="avatar-eye" cx="54" cy="65" r="3" />
        <circle className="avatar-eye" cx="67" cy="65" r="3" />
      </g>
    </svg>
  );
}

function MacadamiaFigure() {
  return (
    <svg viewBox="0 0 160 180" className="battle-avatar__svg">
      <g className="avatar-shadow"><ellipse cx="82" cy="158" rx="50" ry="11" /></g>
      <g className="avatar-body avatar-body--macadamia">
        <path className="avatar-shell" d="M80 28 C117 28 136 58 131 94 C126 135 100 155 75 150 C45 145 26 117 29 82 C32 49 52 28 80 28 Z" />
        <path className="avatar-crack" d="M58 52 C80 72 87 91 76 125" />
        <path className="avatar-crack avatar-crack--small" d="M92 52 C84 72 88 87 105 109" />
        <circle className="avatar-core" cx="77" cy="91" r="20" />
        <circle className="avatar-eye" cx="64" cy="82" r="4" />
        <circle className="avatar-eye" cx="93" cy="78" r="4" />
      </g>
    </svg>
  );
}

function EnemyFigure({ traitId }) {
  return (
    <svg viewBox="0 0 160 180" className="battle-avatar__svg">
      <g className="avatar-shadow"><ellipse cx="80" cy="158" rx="52" ry="11" /></g>
      <g className={`avatar-body avatar-body--enemy avatar-body--${traitId || "food"}`}>
        <path className="enemy-blob" d="M81 25 C113 25 134 49 134 82 C134 121 109 151 76 149 C45 147 25 118 28 83 C31 48 51 25 81 25 Z" />
        <path className="enemy-fold enemy-fold--a" d="M45 70 C63 56 96 55 116 70" />
        <path className="enemy-fold enemy-fold--b" d="M43 105 C63 119 99 119 118 100" />
        <circle className="avatar-eye" cx="64" cy="78" r="5" />
        <circle className="avatar-eye" cx="95" cy="78" r="5" />
        <path className="enemy-mouth" d="M61 105 C72 115 90 115 101 102" />
        <path className="enemy-spike enemy-spike--a" d="M40 43 L24 30" />
        <path className="enemy-spike enemy-spike--b" d="M121 44 L139 33" />
      </g>
    </svg>
  );
}

export function BattleAvatar({
  isPlayer,
  classId,
  traitId,
  color,
  glyph,
  label,
  targeted,
  selected,
  action,
  showcase,
  plain,
}) {
  const showcaseAttack = useShowcaseAttack(showcase);
  const accent = color || "#d4d785";
  const attacking = action === "attack" || showcaseAttack;
  const variant = isPlayer ? classId : `enemy-${traitId || "food"}`;

  return (
    <div
      className={`battle-avatar battle-avatar--${variant} ${attacking ? "is-attacking" : ""} ${
        targeted ? "is-targeted" : ""
      } ${selected ? "is-selected" : ""} ${plain ? "is-plain" : ""}`}
      style={{ "--avatar-accent": accent }}
    >
      <div className="battle-avatar__frame">
        <div className="battle-avatar__figure">
          {isPlayer ? (
            classId === "enoki" ? <EnokiFigure /> : classId === "mini-enoki" ? <MiniEnokiFigure /> : <MacadamiaFigure />
          ) : (
            <EnemyFigure traitId={traitId} />
          )}
        </div>
      </div>
      {label && <div className="battle-avatar__label">{label}</div>}
    </div>
  );
}
