import React, { useState } from "react";
import { HEROES } from "../data/content";
import { BattleAvatar } from "../components/BattleAvatar";

export function HeroSelectScreen({ onConfirm, onBack }) {
  const [classId, setClassId] = useState("enoki");
  const hero = HEROES[classId];

  return (
    <div className="hero-select-screen">
      <div className="hero-select-screen__header">
        <button type="button" className="hero-select-screen__back" onClick={onBack}>
          ← 返回
        </button>
      </div>

      <div className="hero-select-screen__body">
        <h2 className="hero-select-screen__title">选择食物战士！</h2>

        <div className="hero-select-screen__roster">
          {Object.values(HEROES).map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={`hero-select-screen__hero ${candidate.id === classId ? "is-selected" : ""}`}
              onClick={() => setClassId(candidate.id)}
            >
              <BattleAvatar
                isPlayer
                classId={candidate.id}
                color={candidate.accent}
                glyph={candidate.glyph}
                label={candidate.name}
                selected={candidate.id === classId}
                showcase
              />
            </button>
          ))}
        </div>

        <div className="hero-select-screen__intro">
          <strong>{hero.name}</strong>
          <p>{hero.summary}</p>
          <p>{hero.mechanic}</p>
          <small>HP {hero.maxHp} · 能量 {hero.energy}</small>
        </div>

        <button
          type="button"
          className="action-button hero-select-screen__confirm"
          onClick={() => onConfirm(classId)}
        >
          确认选择
        </button>
      </div>
    </div>
  );
}
