import type { ReactElement } from "react";
import type { OgEngine, OgRenderOptions } from "~/shared/lib/og/og-types";
import { VercelOgEngine } from "~/shared/lib/og/vercel-og-engine";

/** Standard OG image canvas: 1200x630 (1.91:1). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Facade over a pluggable OG rendering engine. Applies shared defaults
 * (canvas size) and delegates to the engine. To swap the underlying library,
 * construct with a different `OgEngine` implementation.
 */
export class OgFactory {
  constructor(private readonly engine: OgEngine = new VercelOgEngine()) {}

  render(node: ReactElement, options: OgRenderOptions = {}): Promise<Response> {
    return this.engine.render(node, {
      width: options.width ?? OG_IMAGE_WIDTH,
      height: options.height ?? OG_IMAGE_HEIGHT,
      fonts: options.fonts,
      headers: options.headers,
    });
  }
}

/** Ready-to-use singleton using the default engine. */
export const ogFactory = new OgFactory();
