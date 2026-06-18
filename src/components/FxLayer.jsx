import React from "react";

export function FxFloaters({ floaters }) {
  if (!floaters?.length) {
    return null;
  }

  return (
    <div className="floaters">
      {floaters.map((floater) => (
        <div key={floater.id} className={`floater floater--${floater.tone || "damage"}`}>
          {floater.text}
        </div>
      ))}
    </div>
  );
}

export function HitFxLayer({ effects }) {
  if (!effects?.length) return null;

  return (
    <div className="hit-fx-layer">
      {effects.map((entry) => (
        <div key={entry.id} className="hit-fx-burst" style={{ "--hit-delay": `${entry.delay || 0}ms` }}>
          {entry.effects.map((effect) => (
            <span key={effect} className={`hit-fx hit-fx--${effect}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
