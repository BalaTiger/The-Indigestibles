import React from "react";

export function CampfireScreen({ state, onRest, onLeave }) {
  const layer = state.layers[state.layerIndex];
  return (
    <div className="noncombat-screen">
      <div className="noncombat-screen__head">
        <span className="eyebrow">{layer.subtitle}</span>
        <h2>篝火</h2>
      </div>
      <p className="noncombat-screen__copy">
        一团温热的消化液在缓慢燃烧。休息一会儿，回复 10 点生命。
      </p>
      <div className="noncombat-screen__actions">
        <button type="button" className="action-button" onClick={onRest}>
          休息（+10 HP）
        </button>
        <button type="button" className="action-button action-button--ghost" onClick={onLeave}>
          离开
        </button>
      </div>
    </div>
  );
}
