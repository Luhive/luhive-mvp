import type { ReactElement } from "react";

/** A font registered with the OG renderer. Data must be TTF/OTF/WOFF (not woff2). */
export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: "normal" | "italic";
}

/** Engine-agnostic options for rendering an OG image. */
export interface OgRenderOptions {
  width?: number;
  height?: number;
  fonts?: OgFont[];
  headers?: Record<string, string>;
}

/**
 * A pluggable OG rendering engine ("battery"). Implementations turn a React
 * node into a PNG HTTP response. Swap implementations without touching callers.
 */
export interface OgEngine {
  render(node: ReactElement, options?: OgRenderOptions): Promise<Response>;
}
  