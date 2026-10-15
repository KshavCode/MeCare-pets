import React from 'react';

interface PixelCoinIconProps {
  size?: number;
  className?: string;
}

/**
 * Crisp 8-Bit Pixel Art Gold Coin Emblem with Gleaming Rim & Star Shine
 */
export const PixelCoinIcon: React.FC<PixelCoinIconProps> = ({
  size = 20,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 select-none align-middle ${className}`}
      aria-hidden="true"
    >
      {/* Dark Pixel Outline */}
      <rect x={4} y={1} width={8} height={14} fill="#451A03" />
      <rect x={2} y={3} width={12} height={10} fill="#451A03" />
      <rect x={3} y={2} width={10} height={12} fill="#451A03" />

      {/* Outer Warm Gold Rim */}
      <rect x={5} y={2} width={6} height={12} fill="#D97706" />
      <rect x={3} y={4} width={10} height={8} fill="#D97706" />
      <rect x={4} y={3} width={8} height={10} fill="#F59E0B" />

      {/* Inner Bright Gold Face */}
      <rect x={5} y={3} width={6} height={10} fill="#FACC15" />
      <rect x={4} y={4} width={8} height={8} fill="#FACC15" />

      {/* Top-Left Specular Shine */}
      <rect x={5} y={3} width={3} height={1} fill="#FEF08A" />
      <rect x={4} y={4} width={2} height={2} fill="#FEF08A" />
      <rect x={4} y={4} width={1} height={1} fill="#FFFFFF" />

      {/* Center Embossed Vertical Bar */}
      <rect x={7} y={5} width={2} height={6} fill="#B45309" />
      <rect x={7} y={5} width={1} height={5} fill="#FEF08A" />
    </svg>
  );
};
