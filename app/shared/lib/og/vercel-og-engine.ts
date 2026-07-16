import type { ReactElement } from "react";
import { ImageResponse } from "@vercel/og";
import type { OgEngine, OgRenderOptions } from "~/shared/lib/og/og-types";

/**
 * Default OG engine backed by `@vercel/og` (Satori + resvg-wasm).
 * This is the only file that imports the underlying library.
 */
export class VercelOgEngine implements OgEngine {
  async render(node: ReactElement, options: OgRenderOptions = {}): Promise<Response> {
    return new ImageResponse(node, {
      width: options.width,
      height: options.height,
      fonts: options.fonts?.map((font) => ({
        name: font.name,
        data: font.data,
        weight: font.weight,
        style: font.style,
      })),
      headers: options.headers,
    });
  }
}
