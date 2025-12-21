import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '~/hooks/use-mobile';

const communityImages = [
  '/landing/hero-sliders/community-mock-1.png',
  '/landing/hero-sliders/community-mock-2.png',
  '/landing/hero-sliders/community-mock-3.png',
  '/landing/hero-sliders/community-mock-4.png',
];

const AUTO_PLAY_INTERVAL = 3000;

// Responsive offset values
const STACK_OFFSETS = {
  mobile: {
    card1: { top: 6, left: 12, right: -12, bottom: -6 },
    card2: { top: 12, left: 24, right: -24, bottom: -12 },
    containerPadding: { right: 30, bottom: 15 },
  },
  desktop: {
    card1: { top: 12, left: 24, right: -24, bottom: -12 },
    card2: { top: 24, left: 48, right: -48, bottom: -24 },
    containerPadding: { right: 60, bottom: 30 },
  },
};

export function StackedCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isMobile = useIsMobile();
  
  const offsets = isMobile ? STACK_OFFSETS.mobile : STACK_OFFSETS.desktop;

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % communityImages.length);
  }, []);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const getNextIndex = (current: number) => (current + 1) % communityImages.length;

  return (
    <div className="relative w-full py-0">
      {/* Stack container - responsive padding */}
      <div 
        className="relative mx-auto w-full"
        style={{ 
          paddingRight: `${offsets.containerPadding.right}px`, 
          paddingBottom: `${offsets.containerPadding.bottom}px` 
        }}
      >
        <div className="relative aspect-[16/9] w-full">
          
          {/* Back Card 2 (third in queue) - furthest back */}
          <div 
            className="absolute rounded-xl md:rounded-2xl border border-gray-200/30 bg-white shadow-md"
            style={{
              top: `${offsets.card2.top}px`,
              left: `${offsets.card2.left}px`,
              right: `${offsets.card2.right}px`,
              bottom: `${offsets.card2.bottom}px`,
            }}
          >
            <img
              src={communityImages[(activeIndex + 2) % communityImages.length]}
              alt="Community preview"
              className="h-full w-full rounded-xl md:rounded-2xl object-cover object-top opacity-0"
            />
          </div>

          {/* Back Card 1 (next in queue) */}
          <motion.div
            key={`back-${getNextIndex(activeIndex)}`}
            className="absolute rounded-xl md:rounded-2xl border border-gray-200/50 bg-white shadow-lg"
            style={{
              top: `${offsets.card1.top}px`,
              left: `${offsets.card1.left}px`,
              right: `${offsets.card1.right}px`,
              bottom: `${offsets.card1.bottom}px`,
            }}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={communityImages[getNextIndex(activeIndex)]}
              alt={`Community preview ${getNextIndex(activeIndex) + 1}`}
              className="h-full w-full rounded-xl md:rounded-2xl object-cover object-top opacity-0"
            />
          </motion.div>

          {/* Front Card (active) */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`front-${activeIndex}`}
              className="absolute inset-0 rounded-xl md:rounded-2xl border border-gray-200 bg-white shadow-2xl"
              initial={{ 
                top: offsets.card1.top,
                left: offsets.card1.left,
                right: offsets.card1.right,
                bottom: offsets.card1.bottom,
                opacity: 0.6 
              }}
              animate={{ 
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 1 
              }}
              exit={{ 
                x: '-100%', 
                opacity: 0, 
                rotate: -8,
              }}
              transition={{
                duration: 0.6,
                ease: [0.32, 0.72, 0, 1],
              }}
            >
              <img
                src={communityImages[activeIndex]}
                alt={`Community preview ${activeIndex + 1}`}
                className="h-full w-full rounded-xl md:rounded-2xl object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dot Navigation */}
      {/* <div className="mt-4 flex items-center justify-center gap-2">
        {communityImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'w-6 bg-[#FF7A1A]'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div> */}
    </div>
  );
}
