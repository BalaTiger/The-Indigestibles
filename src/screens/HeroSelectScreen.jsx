import React, { useState } from "react";
import { Leaf, Shell } from "lucide-react";
import { HEROES } from "../data/content";

function classIcon(classId) {
  return classId === "enoki" ? Leaf : Shell;
}

export function HeroSelectScreen({ onConfirm, onBack }) {
  const [classId, setClassId] = useState("enoki");
  const [buildId, setBuildId] = useState("guardian");
  const hero = HEROES[classId];
  const build = hero.builds[buildId];

  return (
    <div className="hero-select-screen">
      <div className="hero-select-screen__header">
        <button type="button" className="hero-select-screen__back" onClick={onBack}>
          ← 返回
        </button>
        <h2>选择你的宿主</h2>
      </div>

      <div className="hero-select-screen__body">
        <div className="hero-select-screen__choices">
          <div className="hero-select-screen__section">
            <div className="rail-title">宿主</div>
            <div className="segmented">
              {Object.values(HEROES).map((candidate) => {
                const Icon = classIcon(candidate.id);
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    className={`segment ${candidate.id === classId ? "is-active" : ""}`}
                    onClick={() => {
                      setClassId(candidate.id);
                      setBuildId(Object.keys(candidate.builds)[0]);
                    }}
                  >
                    <Icon size={16} />
                    <span>{candidate.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hero-select-screen__section">
            <div className="rail-title">构筑</div>
            <div className="segmented segmented--builds">
              {Object.values(hero.builds).map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className={`segment ${candidate.id === buildId ? "is-active" : ""}`}
                  onClick={() => setBuildId(candidate.id)}
                >
                  <span>{candidate.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="hero-copy">
            <strong>{hero.summary}</strong>
            <p>{hero.mechanic}</p>
            <p>{build.passive}</p>
            <p>{build.vibe}</p>
          </div>
        </div>

        <div className="hero-select-screen__preview">
          <div className="hero-select-screen__card" style={{ "--hero-accent": hero.accent }}>
            <div className="hero-select-screen__glyph">{hero.glyph}</div>
            <div className="hero-select-screen__name">{hero.name}</div>
            <div className="hero-select-screen__build">{build.name}</div>
          </div>
        </div>
      </div>

      <div className="hero-select-screen__footer">
        <button type="button" className="action-button" onClick={() => onConfirm(classId, buildId)}>
          确认选择
        </button>
      </div>
    </div>
  );
}
