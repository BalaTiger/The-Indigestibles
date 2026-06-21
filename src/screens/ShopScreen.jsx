import React from "react";
import { RELICS } from "../data/content";
import { CardView } from "../components/CardView";

const relicIconClass = {
  "reward-relic": "relic-icon--eye",
  "gold-relic": "relic-icon--sac",
  "map-link-relic": "relic-icon--shortcut",
  "barrier-keep-relic": "relic-icon--film",
};

export function ShopScreen({ state, onBuyCard, onBuyRelic, onLeave }) {
  const layer = state.layers[state.layerIndex];
  const shop = state.currentShop;
  const canAfford = (price) => state.player.glycogen >= price;

  return (
    <div className="noncombat-screen shop-screen">
      <div className="noncombat-screen__head">
        <span className="eyebrow">{layer.subtitle}</span>
        <h2>商店</h2>
      </div>
      <div className="shop-wallet" aria-label={`当前糖原 ${state.player.glycogen}`}>
        <span className="glycogen-coin" aria-hidden="true" />
        <strong>{state.player.glycogen}</strong>
      </div>
      <div className="shop-shelves">
        <div className="shop-row">
          {shop?.cards.map((slot, index) => (
            <button
              key={`${slot.card.key}-${index}`}
              type="button"
              className="shop-card-item"
              disabled={slot.sold || !canAfford(slot.price)}
              onClick={() => onBuyCard(index)}
            >
              <CardView card={slot.card} playable displayOnly />
              <span className="shop-price">
                <span className="glycogen-coin glycogen-coin--small" aria-hidden="true" />
                <strong>{slot.price}</strong>
              </span>
              {slot.sold && <span className="shop-sold">已售</span>}
            </button>
          ))}
        </div>
        <div className="shop-row shop-row--relics">
          {shop?.relics.map((slot, index) => {
            const relic = RELICS[slot.relicId];
            return (
              <button
                key={`${slot.relicId}-${index}`}
                type="button"
                className="shop-relic-item"
                disabled={slot.sold || !canAfford(slot.price)}
                onClick={() => onBuyRelic(index)}
                aria-label={`${relic.name}，售价 ${slot.price} 糖原。${relic.description}`}
              >
                <span className={`relic-icon ${relicIconClass[slot.relicId] || "relic-icon--sac"}`} aria-hidden="true" />
                <span className="shop-relic-copy">
                  <strong>{relic.name}</strong>
                  <small>{relic.description}</small>
                </span>
                <span className="shop-price">
                  <span className="glycogen-coin glycogen-coin--small" aria-hidden="true" />
                  <strong>{slot.price}</strong>
                </span>
                {slot.sold && <span className="shop-sold">已售</span>}
              </button>
            );
          })}
        </div>
      </div>
      <button type="button" className="action-button" onClick={onLeave}>
        离开商店
      </button>
    </div>
  );
}
