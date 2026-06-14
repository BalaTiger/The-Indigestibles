import React from "react";

export function DefeatModal({ onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card--defeat">
        <strong>消化失败</strong>
        <p>你被肠道彻底分解，这次蠕动到此为止。要重新开局吗？</p>
        <button type="button" className="action-button" onClick={onConfirm}>
          返回主界面
        </button>
      </div>
    </div>
  );
}
