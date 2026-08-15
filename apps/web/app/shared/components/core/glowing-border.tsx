'use client';

import * as React from 'react';

import { cn } from '~/shared/lib/utils';

export interface GlowBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  colors?: string[];
  duration?: number;
  glowIntensity?: 'subtle' | 'medium' | 'intense';
  paused?: boolean;
  borderRadius?: string;
  innerClassName?: string;
}

const GLOW_CONFIG = {
	subtle: { blur: '6px', opacity: 0.3 },
	medium: { blur: '12px', opacity: 0.45 },
	intense: { blur: '18px', opacity: 0.6 },
} as const;

function parseBorderRadiusPx(value: string): number {
  const match = value.match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : 12;
}

export const GlowBorder = React.forwardRef<HTMLDivElement, GlowBorderProps>(
  (
    {
      children,
      colors = ['#a855f7', '#3b82f6', '#06b6d4', '#ec4899'],
      duration = 3,
      glowIntensity = 'medium',
      paused = false,
      borderRadius = '12px',
      innerClassName,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const { blur, opacity } = GLOW_CONFIG[glowIntensity];
    const gradient = `conic-gradient(from var(--glow-angle), ${colors.join(', ')}, ${colors[0]})`;
    const innerRadius = `${Math.max(0, parseBorderRadiusPx(borderRadius) - 1)}px`;
    const layerRadius = { borderRadius };
    const animation = paused ? 'none' : 'glow-rotate var(--glow-duration) linear infinite';

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        style={
          {
            borderRadius,
            '--glow-duration': `${duration}s`,
            '--glow-blur': blur,
            '--glow-opacity': opacity,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <style>{`
          @property --glow-angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
          }
          @keyframes glow-rotate {
            from { --glow-angle: 0deg; }
            to { --glow-angle: 360deg; }
          }
        `}</style>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1px] opacity-[var(--glow-opacity)] blur-[var(--glow-blur)]"
          style={{
            ...layerRadius,
            background: gradient,
            animation,
          }}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1px]"
          style={{
            ...layerRadius,
            background: gradient,
            animation,
          }}
        />

        <span
          aria-hidden="true"
          className={cn('pointer-events-none absolute inset-[1px] bg-background', innerClassName)}
          style={{ borderRadius: innerRadius }}
        />

        <div className="relative z-10 flex h-full min-h-full flex-col">{children}</div>
      </div>
    );
  },
);

GlowBorder.displayName = 'GlowBorder';

export default GlowBorder;
