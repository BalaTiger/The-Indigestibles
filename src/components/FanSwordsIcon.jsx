import React from "react";

export function FanSwordsIcon({ size = 24 }) {
  const sword = (
    <g>
      <path d="M12 2 L14.2 11.5 L12 14.2 L9.8 11.5 Z" />
      <path d="M12 14.2 L12 20.4" />
      <path d="M8.4 14.2 L15.6 14.2" />
      <path d="M10.8 21.4 L13.2 21.4" />
    </g>
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="rotate(28 12 12)">
        <g opacity="0.72" transform="translate(-4 1.4) rotate(-18 12 12)">
          {sword}
        </g>
        <path d="M11.4 5.2 L13.8 16.4" stroke="var(--intent-mask, #1f1112)" strokeWidth="4" />
        <g opacity="0.9" transform="translate(0 0.1)">
          {sword}
        </g>
        <path d="M15.4 6.2 L17.8 17" stroke="var(--intent-mask, #1f1112)" strokeWidth="4" />
        <g transform="translate(4 1.4) rotate(18 12 12)">
          {sword}
        </g>
      </g>
    </svg>
  );
}
