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
