import { useRef, useState } from "react";

/**
 * Expand/collapse state for a hub section. Collapsing scrolls the section back
 * into view when its top has scrolled away, so the reader isn't left below a
 * list that just got shorter.
 */
export function useSectionExpansion<T extends HTMLElement>() {
  const sectionRef = useRef<T>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  function toggle() {
    const section = sectionRef.current;
    if (isExpanded && section && section.getBoundingClientRect().top < 0) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        section.scrollIntoView({
          block: "start",
          behavior: prefersReducedMotion ? "auto" : "smooth",
        }),
      );
    }
    setIsExpanded(!isExpanded);
  }

  return { sectionRef, isExpanded, toggle };
}
