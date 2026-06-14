import React from "react";

export function EventScreen({ state, onLeave }) {
  const layer = state.layers[state.layerIndex];
  return (
    <div className="noncombat-screen">
      <div className="noncombat-screen__head">
        <span className="eyebrow">{layer.subtitle}</span>
        <h2>事件</h2>
      </div>
      <p className="noncombat-screen__copy">
        肠壁皱褶里传来一阵低语，但你现在没空细听。事件系统后续会提供分支选择。
      </p>
      <button type="button" className="action-button" onClick={onLeave}>
        继续旅程
      </button>
    </div>
  );
}
