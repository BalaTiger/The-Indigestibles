import React from "react";

export function FanSwordsIcon({ size = 24 }) {
  const pivot = "4 21";
  const left = `translate(${pivot}) rotate(70) scale(1.08) translate(-20 -20)`;
  const middle = `translate(${pivot}) rotate(90) scale(1.08) translate(-20 -20)`;
  const right = `translate(${pivot}) rotate(110) scale(1.08) translate(-20 -20)`;

  const sword = (
    <g>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
    </g>
  );

  const bladeFill = (
    <path
      d="M14.5 17.5 L3 6 L3 3 L6 3 L17.5 14.5 Z"
      fill="var(--intent-mask, #4b2a25)"
      stroke="var(--intent-mask, #4b2a25)"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      overflow="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g opacity="0.72" transform={left}>
        {sword}
      </g>
      <g transform={middle}>{bladeFill}</g>
      <g transform={middle}>
        {sword}
      </g>
      <g transform={right}>{bladeFill}</g>
      <g transform={right}>{sword}</g>
    </svg>
  );
}
