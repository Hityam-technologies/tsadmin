import React from 'react';

/**
 * BrandGradientBackground
 * Exact 1:1 reproduction of the signature cream-gold gradient background
 * from the Tripuraa Sangrahah mobile app (tripuraasangrahah/src/components/gradientBackground.jsx).
 *
 * Layers:
 * 1. Base Layer: Vertical linear gradient (bgEdge #E9D7A0 -> bgMid #F7EFCB -> bgCenter #FFFDF0 35-60% -> bgMid -> bgEdge)
 * 2. Vignette Layer: Soft radial gradient from transparent center to bgCorner #DFC688 at corners (26% opacity)
 * 3. Bottom Glow: Faint baseGold #D4AF37 glow (13% opacity) near bottom for subtle warmth
 */
export function BrandGradientBackground({
  children,
  className = '',
  idPrefix = 'atelier_',
  variant = 'cream-gold',
  style = {},
}) {
  const isSaffron = variant === 'saffron';
  const linearId = `${idPrefix}${isSaffron ? 'saffronLinear' : 'creamGoldLinear'}`;
  const vignetteId = `${idPrefix}${isSaffron ? 'saffronVignette' : 'vignetteRadial'}`;
  const glowId = `${idPrefix}${isSaffron ? 'saffronGlow' : 'bottomGoldGlow'}`;

  // Theme palettes: Royal Burnt Saffron Silk vs Signature Cream-Gold
  const colors = isSaffron
    ? {
        edge: '#752809',
        mid: '#BF5B21',
        center: '#FBE4D4',
        corner: '#46200A',
        glow: '#DE7335',
        bg: '#BF5B21',
      }
    : {
        edge: '#E9D7A0',
        mid: '#F7EFCB',
        center: '#FFFDF0',
        corner: '#DFC688',
        glow: '#D4AF37',
        bg: '#FFFDF0',
      };

  return (
    <div
      className={`relative min-h-screen w-full ${className}`}
      style={{
        backgroundColor: colors.bg,
        ...style,
      }}
    >
      {/* Background SVG Layer: fixed edge-to-edge behind all screen content */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 400 900"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 1. Base Layer: Vertical linear gradient */}
            <linearGradient id={linearId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.edge} />
              <stop offset="18%" stopColor={colors.mid} />
              <stop offset="35%" stopColor={colors.center} />
              <stop offset="60%" stopColor={colors.center} />
              <stop offset="82%" stopColor={colors.mid} />
              <stop offset="100%" stopColor={colors.edge} />
            </linearGradient>

            {/* 2. Vignette Layer: Centered slightly above middle, transparent in center to corner at corners */}
            <radialGradient id={vignetteId} cx="50%" cy="44%" rx="75%" ry="65%">
              <stop offset="0%" stopColor={colors.corner} stopOpacity="0" />
              <stop offset="42%" stopColor={colors.corner} stopOpacity="0" />
              <stop offset="70%" stopColor={colors.corner} stopOpacity={isSaffron ? '0.12' : '0.08'} />
              <stop offset="88%" stopColor={colors.corner} stopOpacity={isSaffron ? '0.24' : '0.18'} />
              <stop offset="100%" stopColor={colors.corner} stopOpacity={isSaffron ? '0.35' : '0.26'} />
            </radialGradient>

            {/* 3. Faint Warm Glow near bottom */}
            <radialGradient id={glowId} cx="50%" cy="96%" rx="60%" ry="35%">
              <stop offset="0%" stopColor={colors.glow} stopOpacity={isSaffron ? '0.22' : '0.13'} />
              <stop offset="45%" stopColor={colors.glow} stopOpacity={isSaffron ? '0.10' : '0.06'} />
              <stop offset="80%" stopColor={colors.glow} stopOpacity={isSaffron ? '0.02' : '0.015'} />
              <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Layer 1: Base Linear Gradient */}
          <rect width="100%" height="100%" fill={`url(#${linearId})`} />

          {/* Layer 2: Vignette */}
          <rect width="100%" height="100%" fill={`url(#${vignetteId})`} />

          {/* Layer 3: Warm Bottom Glow */}
          <rect width="100%" height="100%" fill={`url(#${glowId})`} />
        </svg>
      </div>

      {/* Screen Content Layer */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}

export default BrandGradientBackground;

