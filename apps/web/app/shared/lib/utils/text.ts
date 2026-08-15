/**
 * Utility functions for working with text.
 *
 * Keep these helpers framework-agnostic so they can be reused
 * in routes, services, and React components without pulling in
 * any browser-only or React-specific dependencies.
 */

/**
 * Counts the number of words in a string.
 *
 * A "word" is any sequence of non-whitespace characters separated by
 * one or more whitespace characters. Empty or whitespace-only strings
 * return 0.
 */
export function countWords(text: string): number {
  if (!text || text.trim() === "") return 0;
  return text.trim().split(/\s+/).length;
}
