'use client';

import * as React from 'react';
import { type HTMLMotionProps, motion, type Transition } from 'motion/react';

import { cn } from '~/shared/lib/utils/cn';
import { useIsMobile } from '~/shared/hooks/use-mobile';

type ShimmeringTextProps = {
  text: string;
  duration?: number;
  transition?: Transition;
  wave?: boolean;
  color?: string;
  shimmeringColor?: string;
} & Omit<HTMLMotionProps<'span'>, 'children'>;

function ShimmeringText({
  text,
  duration = 1,
  transition,
  wave = false,
  className,
  color = 'var(--color-neutral-700)',
  shimmeringColor = 'var(--color-neutral-300)',
  ...props
}: ShimmeringTextProps) {
  const isMobile = useIsMobile();

  // Adjust animation parameters based on screen size for better performance and UX
  const waveAnimation = React.useMemo(() => {
    if (!wave) return {};

    // Reduce animation intensity on mobile for better performance and subtlety
    return isMobile
      ? {
        x: [0, 3, 0],
        y: [0, -3, 0],
        scale: [1, 1.05, 1],
        rotateY: [0, 10, 0],
      }
      : {
        x: [0, 5, 0],
        y: [0, -5, 0],
        scale: [1, 1.1, 1],
        rotateY: [0, 15, 0],
      };
  }, [wave, isMobile]);

  // Adjust perspective for different screen sizes
  const perspective = isMobile ? '300px' : '500px';

  return (
    <motion.span
      className={cn('relative inline break-words', className)}
      style={
        {
          '--shimmering-color': shimmeringColor,
          '--color': color,
          color: 'var(--color)',
          perspective,
        } as React.CSSProperties
      }
      {...props}
    >
      {text?.split('')?.map((char, i) => (
        <motion.span
          key={i}
          className={cn(
            'inline-block [transform-style:preserve-3d]',
            char === ' ' ? 'w-[0.25em]' : 'whitespace-pre'
          )}
          initial={{
            ...(wave
              ? {
                  scale: 1,
                  rotateY: 0,
                }
              : {}),
            color: 'var(--color)',
          }}
          animate={{
            ...waveAnimation,
            color: ['var(--color)', 'var(--shimmering-color)', 'var(--color)'],
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: 'loop',
            repeatDelay: text.length * 0.05,
            delay: (i * duration) / text.length,
            ease: 'easeInOut',
            ...transition,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export { ShimmeringText, type ShimmeringTextProps };