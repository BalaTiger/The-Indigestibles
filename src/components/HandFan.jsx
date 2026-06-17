import React from "react";
import { CardView } from "./CardView";

export function HandFan({
  cards,
  selectedCardId,
  aimingCardId,
  canPlayCard,
  onCardClick,
  onCardPointerDown,
  onCardMouseEnter,
  onCardMouseLeave,
  traitPreview,
}) {
  const count = cards.length;
  const spread = count <= 1 ? 0 : Math.min(15, 54 / Math.max(1, count - 1));

  return (
    <div className="hand-fan">
      {cards.map((card, index) => {
        const center = (count - 1) / 2;
        const offset = index - center;
        const rotate = offset * spread;
        const x = offset * 118;
        const y = Math.abs(offset) * 6;
        const zIndex = 100 + index;

        return (
          <CardView
            key={card.instanceId}
            card={card}
            selected={selectedCardId === card.instanceId}
            aimingSource={aimingCardId === card.instanceId}
            playable={canPlayCard(card)}
            onClick={(event) => onCardClick(card, event)}
            onPointerDown={(event) => onCardPointerDown?.(card, event)}
            onMouseEnter={() => onCardMouseEnter?.(card)}
            onMouseLeave={() => onCardMouseLeave?.(card)}
            traitPreview={traitPreview}
            layoutStyle={{
              "--card-x": `${x}px`,
              "--card-y": `${y}px`,
              "--card-rotate": `${rotate}deg`,
              "--card-stack": zIndex,
            }}
          />
        );
      })}
      {!cards.length && <div className="hand-fan__empty">手牌区已经被胃液舔干净了。</div>}
    </div>
  );
}
