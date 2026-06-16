import React from "react";

export function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="hud-chip hud-chip--compact">
      <Icon size={18} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
