import React from "react";

const paletteMap = {
  enoki: {
    edge: "#c7cf73",
    body: "linear-gradient(180deg, rgba(61, 73, 44, 0.98), rgba(28, 34, 21, 0.98))",
    badge: "#d7dd92",
  },
  guardian: {
    edge: "#a9d17a",
    body: "linear-gradient(180deg, rgba(53, 78, 40, 0.98), rgba(18, 28, 15, 0.98))",
    badge: "#d9f0a2",
  },
  martyr: {
    edge: "#f1b878",
    body: "linear-gradient(180deg, rgba(86, 52, 35, 0.98), rgba(28, 16, 12, 0.98))",
    badge: "#ffd0a2",
  },
  macadamia: {
    edge: "#efbe74",
    body: "linear-gradient(180deg, rgba(92, 67, 41, 0.98), rgba(36, 24, 17, 0.98))",
    badge: "#ffe2b5",
  },
  focus: {
    edge: "#f0937a",
    body: "linear-gradient(180deg, rgba(110, 53, 38, 0.98), rgba(38, 18, 13, 0.98))",
    badge: "#ffd1c4",
  },
  kaleidoscope: {
    edge: "#8ed3c3",
    body: "linear-gradient(180deg, rgba(43, 72, 68, 0.98), rgba(17, 27, 26, 0.98))",
    badge: "#c7f0e6",
  },
};

export function CardView({
  card,
  selected,
  playable,
  floating,
  aimingSource,
  layoutStyle,
  onClick,
  onPointerDown,
  onMouseEnter,
  onMouseLeave,
  traitPreview,
}) {
  const palette = paletteMap[card.palette] || paletteMap.enoki;
  const showTrait = traitPreview && card.key === "crack-and-seal";

  return (
    <button
      type="button"
      className={`game-card ${selected ? "is-selected" : ""} ${playable ? "is-playable" : "is-disabled"} ${
        floating ? "is-floating" : ""
      } ${aimingSource ? "is-aiming-source" : ""}`}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      draggable={false}
      style={{
        ...layoutStyle,
        "--card-edge": palette.edge,
        "--card-bg": palette.body,
        "--card-badge": palette.badge,
      }}
    >
      <span className="game-card__cost">{card.cost}</span>
      <span className="game-card__suite">{card.suite === "attack" ? "攻击" : "技能"}</span>
      <div className="game-card__name">{card.name}</div>
      <div className="game-card__text">{card.description}</div>
      {showTrait && (
        <div className="game-card__trait" style={{ "--trait-color": traitPreview.color }}>
          <span>{traitPreview.short}</span>
          <div>
            <strong>{traitPreview.name}</strong>
            <small>{traitPreview.description}</small>
          </div>
        </div>
      )}
      <div className="game-card__footer">
        <span>{card.target === "enemy" ? "选敌" : "即时"}</span>
        <span>{card.instanceId.split("-").slice(-1)[0]}</span>
      </div>
    </button>
  );
}
