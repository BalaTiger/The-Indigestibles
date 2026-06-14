import React from "react";
import { MAP_CONFIG } from "../data/content";

const NODE_SIZE = 44;

function nodeFill(type, unlocked, cleared) {
  if (cleared) return "rgba(255, 255, 255, 0.16)";
  if (!unlocked) return "rgba(255, 255, 255, 0.06)";
  return MAP_CONFIG.nodeTypeColors[type];
}

function nodeStroke(type, unlocked, cleared, isCurrent) {
  if (isCurrent) return "#fff";
  if (cleared) return "rgba(255, 255, 255, 0.22)";
  if (!unlocked) return "rgba(255, 255, 255, 0.08)";
  return "rgba(255, 255, 255, 0.35)";
}

export function MapScreen({ state, onNodeClick }) {
  const layer = state.layers[state.layerIndex];
  const nodes = layer.nodes;
  const width = 1000;
  const height = 720;

  const positions = new Map(
    nodes.map((node) => [
      node.id,
      {
        x: node.x * width,
        y: node.y * height,
      },
    ]),
  );

  const currentNode = nodes.find((node) => node.id === state.currentNodeId);

  // 把当前可点击的节点作为一个整体居中；如果整体超出画布则缩放，始终不超出地图区域
  const clickableNodes = nodes.filter((node) => node.unlocked && !node.cleared);
  const focusNodes = clickableNodes.length ? clickableNodes : nodes;
  const focusPositions = focusNodes.map((node) => positions.get(node.id));
  const xs = focusPositions.map((p) => p.x);
  const ys = focusPositions.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const pad = 60;
  const availW = Math.max(1, width - pad * 2);
  const availH = Math.max(1, height - pad * 2);
  const bboxW = Math.max(1, maxX - minX);
  const bboxH = Math.max(1, maxY - minY);
  const scale = Math.min(1, availW / bboxW, availH / bboxH);
  const cameraTransform = `translate(${width / 2 - cx * scale}, ${height / 2 - cy * scale}) scale(${scale})`;

  return (
    <div className="map-screen">
      <div className="map-screen__head">
        <div>
          <span className="eyebrow">{layer.subtitle}</span>
          <h2>{layer.name}</h2>
        </div>
        <div className="map-screen__legend">
          {Object.entries(MAP_CONFIG.nodeTypeNames).map(([type, name]) => (
            <div key={type} className="map-screen__legend-item">
              <span className="map-screen__legend-dot" style={{ background: MAP_CONFIG.nodeTypeColors[type] }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="map-screen__canvas">
        <svg viewBox={`0 0 ${width} ${height}`} className="map-screen__svg">
          <g transform={cameraTransform}>
            <g className="map-links">
            {nodes.map((node) =>
              node.nextIds.map((nextId) => {
                const from = positions.get(node.id);
                const to = positions.get(nextId);
                const cleared = node.cleared;
                return (
                  <line
                    key={`${node.id}-${nextId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={`map-link ${cleared ? "is-cleared" : ""}`}
                  />
                );
              }),
            )}
          </g>

          <g className="map-nodes">
            {nodes.map((node) => {
              const pos = positions.get(node.id);
              const isCurrent = currentNode?.id === node.id;
              const unlocked = node.unlocked;
              const cleared = node.cleared;
              const color = MAP_CONFIG.nodeTypeColors[node.type];
              const label = MAP_CONFIG.nodeTypeNames[node.type];
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className={`map-node ${isCurrent ? "is-current" : ""} ${unlocked ? "is-unlocked" : ""} ${cleared ? "is-cleared" : ""}`}
                  onClick={() => unlocked && onNodeClick(node)}
                  style={{ cursor: unlocked ? "pointer" : "default" }}
                >
                  <circle
                    r={NODE_SIZE / 2}
                    fill={nodeFill(node.type, unlocked, cleared)}
                    stroke={nodeStroke(node.type, unlocked, cleared, isCurrent)}
                    strokeWidth={isCurrent ? 3 : 2}
                  />
                  <text
                    y={-NODE_SIZE / 2 - 8}
                    textAnchor="middle"
                    className="map-node__label"
                    fill={unlocked || cleared ? "#f7ead9" : "rgba(247, 234, 217, 0.42)"}
                  >
                    {label}
                  </text>
                  {isCurrent && (
                    <circle
                      r={NODE_SIZE / 2 + 6}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      opacity={0.6}
                      className="map-node__pulse"
                    />
                  )}
                  {cleared && (
                    <text y={5} textAnchor="middle" className="map-node__check" fill="#f7ead9">
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
