import React from "react";

export function ShopScreen({ state, onLeave }) {
  const layer = state.layers[state.layerIndex];
  return (
    <div className="noncombat-screen">
      <div className="noncombat-screen__head">
        <span className="eyebrow">{layer.subtitle}</span>
        <h2>商店</h2>
      </div>
      <p className="noncombat-screen__copy">
        黏液摊位还没开张。等美术和货物清单到位后，这里会陈列可购买的卡牌与遗物。
      </p>
      <button type="button" className="action-button" onClick={onLeave}>
        离开商店
      </button>
    </div>
  );
}
