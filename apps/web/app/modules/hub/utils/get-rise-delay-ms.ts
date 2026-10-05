const STAGGER_STEP_MS = 45;
const MAX_STAGGERED_ITEMS = 8;

/** Stagger is capped so a long list never waits on its own entrance. */
export function getRiseDelayMs(index: number) {
  return Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_STEP_MS;
}
