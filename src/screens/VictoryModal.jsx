import React from "react";

export function VictoryModal({ state, onConfirm }) {
  const node = state.layers[state.layerIndex].nodes.find((n) => n.id === state.currentNodeId);
  const isFinalBoss = node?.type === "boss" && state.layerIndex === state.layers.length - 1;
  const isLayerBoss = node?.type === "boss" && !isFinalBoss;

  let title = "战斗胜利";
  let desc = "你清空了这片肠道，前方的节点已经解锁。";
  let button = "继续下探";

  if (isLayerBoss) {
    title = "层 Boss 击败";
    desc = `你打通了${state.layers[state.layerIndex].name}，可以进入下一层了。`;
    button = "进入下一层";
  } else if (isFinalBoss) {
    title = "通关！";
    desc = "你一路从胃蠕动到大肠尽头，终于重获自由。";
    button = "返回主界面";
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card--victory">
        <strong>{title}</strong>
        <p>{desc}</p>
        <button type="button" className="action-button" onClick={onConfirm}>
          {button}
        </button>
      </div>
    </div>
  );
}
