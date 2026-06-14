import React from "react";

function HeroEnokiAvatar({ accent }) {
  return (
    <svg viewBox="0 0 120 160" className="battle-avatar__svg">
      <g className="battle-avatar__silhouette">
        <ellipse cx="60" cy="38" rx="34" ry="22" fill={accent} opacity="0.9" />
        <rect x="48" y="54" width="24" height="70" rx="10" fill={accent} opacity="0.7" />
        <path d="M48 110 Q36 140 30 152" stroke={accent} strokeWidth="4" fill="none" opacity="0.6" />
        <path d="M72 110 Q84 140 90 152" stroke={accent} strokeWidth="4" fill="none" opacity="0.6" />
        <path d="M54 120 Q50 145 46 156" stroke={accent} strokeWidth="3" fill="none" opacity="0.5" />
        <path d="M66 120 Q70 145 74 156" stroke={accent} strokeWidth="3" fill="none" opacity="0.5" />
      </g>
    </svg>
  );
}

function HeroMacadamiaAvatar({ accent }) {
  return (
    <svg viewBox="0 0 120 160" className="battle-avatar__svg">
      <g className="battle-avatar__silhouette">
        <circle cx="60" cy="80" r="46" fill={accent} opacity="0.85" />
        <path d="M38 58 L82 102" stroke="#2b1d14" strokeWidth="4" opacity="0.5" />
        <path d="M82 58 L38 102" stroke="#2b1d14" strokeWidth="4" opacity="0.5" />
        <circle cx="60" cy="80" r="18" fill="none" stroke="#2b1d14" strokeWidth="3" opacity="0.4" />
      </g>
    </svg>
  );
}

function EnemyAvatar({ traitId, color }) {
  const base = color || "#cda16d";

  const shape = (() => {
    switch (traitId) {
      case "acidSplash":
        return (
          <>
            <circle cx="60" cy="70" r="40" fill={base} opacity="0.85" />
            <circle cx="44" cy="58" r="8" fill="#fff8ee" opacity="0.6" />
            <circle cx="76" cy="58" r="8" fill="#fff8ee" opacity="0.6" />
            <path d="M40 90 Q60 110 80 90" stroke="#fff8ee" strokeWidth="4" fill="none" opacity="0.5" />
          </>
        );
      case "mucusWrap":
        return (
          <>
            <ellipse cx="60" cy="80" rx="44" ry="38" fill={base} opacity="0.8" />
            <path d="M30 70 Q60 50 90 70" stroke="#fff8ee" strokeWidth="3" fill="none" opacity="0.4" />
            <path d="M30 90 Q60 110 90 90" stroke="#fff8ee" strokeWidth="3" fill="none" opacity="0.4" />
          </>
        );
      case "bileJet":
        return (
          <>
            <polygon points="60,30 95,120 60,105 25,120" fill={base} opacity="0.85" />
            <circle cx="60" cy="60" r="10" fill="#fff8ee" opacity="0.6" />
          </>
        );
      case "villusSnare":
        return (
          <>
            <circle cx="60" cy="80" r="36" fill={base} opacity="0.85" />
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const x1 = 60 + Math.cos(angle) * 36;
              const y1 = 80 + Math.sin(angle) * 36;
              const x2 = 60 + Math.cos(angle) * 52;
              const y2 = 80 + Math.sin(angle) * 52;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={base} strokeWidth="4" opacity="0.7" />;
            })}
          </>
        );
      case "gasBurst":
        return (
          <>
            <circle cx="60" cy="80" r="42" fill={base} opacity="0.75" />
            <circle cx="44" cy="64" r="10" fill="#fff8ee" opacity="0.3" />
            <circle cx="78" cy="76" r="14" fill="#fff8ee" opacity="0.25" />
            <circle cx="54" cy="100" r="8" fill="#fff8ee" opacity="0.3" />
          </>
        );
      case "clotClamp":
        return (
          <>
            <rect x="28" y="48" width="64" height="64" rx="18" fill={base} opacity="0.85" />
            <rect x="48" y="44" width="24" height="72" rx="6" fill="#fff8ee" opacity="0.3" />
          </>
        );
      case "dryPlug":
        return (
          <>
            <rect x="42" y="34" width="36" height="92" rx="10" fill={base} opacity="0.85" />
            <rect x="36" y="34" width="48" height="18" rx="4" fill="#fff8ee" opacity="0.4" />
          </>
        );
      case "putridRush":
        return (
          <>
            <circle cx="60" cy="80" r="40" fill={base} opacity="0.8" />
            <circle cx="45" cy="65" r="8" fill="#fff8ee" opacity="0.4" />
            <circle cx="75" cy="85" r="10" fill="#fff8ee" opacity="0.35" />
            <circle cx="55" cy="100" r="6" fill="#fff8ee" opacity="0.4" />
          </>
        );
      default:
        return <circle cx="60" cy="80" r="40" fill={base} opacity="0.8" />;
    }
  })();

  return (
    <svg viewBox="0 0 120 160" className="battle-avatar__svg">
      <g className="battle-avatar__silhouette">{shape}</g>
    </svg>
  );
}

export function BattleAvatar({ entity, isPlayer, classId, traitId, color, glyph, label, targeted }) {
  const accent = color || "#d4d785";

  return (
    <div
      className={`battle-avatar ${targeted ? "is-targeted" : ""}`}
      style={{ "--avatar-accent": accent }}
    >
      <div className="battle-avatar__frame">
        {isPlayer ? (
          classId === "enoki" ? (
            <HeroEnokiAvatar accent={accent} />
          ) : (
            <HeroMacadamiaAvatar accent={accent} />
          )
        ) : (
          <EnemyAvatar traitId={traitId} color={accent} />
        )}
      </div>
      <div className="battle-avatar__glyph">{glyph}</div>
      <div className="battle-avatar__label">{label}</div>
    </div>
  );
}
