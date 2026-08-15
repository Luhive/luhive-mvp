/**
 * Hero dashboard preview — scroll-driven 3D entrance inspired by Framer/Dreelio.
 * The image starts tilted/scaled and transforms to normal as the user scrolls.
 */
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";

const HERO_DASHBOARD_SRC = "/landing/HeroDashboard.png";

export function LandingHeroDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [25, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [-60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.8, 1]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative mx-auto w-full max-w-[1072px] [perspective:1200px]">
        <motion.div
          className="relative overflow-hidden rounded-[20px] md:rounded-[20px] border-2 border-[rgba(97,74,68,0.2)] bg-white shadow-[0px_4px_50px_0px_rgba(97,74,68,0.06)] will-change-transform max-md:w-[115%] max-md:rounded-l-[20px] max-md:rounded-r-none max-md:border-r-0"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
            rotateX,
            scale,
            y,
            opacity,
          }}
        >
          <div className="aspect-[6/5] sm:aspect-[4/3] md:aspect-[2646/1762] w-full">
            <img
              src={HERO_DASHBOARD_SRC}
              width={2646}
              height={1762}
              alt="Luhive community dashboard preview"
              className="h-full w-full object-cover object-left-top md:object-top"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
