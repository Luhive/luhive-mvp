import type { ReactElement } from "react";
import { ImageResponse } from "@vercel/og";
import type { OgEngine, OgRenderOptions } from "~/shared/lib/og/og-types";

/**
 * Default OG engine backed by `@vercel/og` (Satori + resvg-wasm).
 * This is the only file that imports the underlying library.
 */
export class VercelOgEngine implements OgEngine {
  async render(node: ReactElement, options: OgRenderOptions = {}): Promise<Response> {
    // Do NOT pass headers into ImageResponse: it appends onto its own defaults,
    // producing malformed values like `Content-Type: image/png, image/png` that
    // strict crawlers (Telegram, Discord, Signal) reject. Instead overwrite.
    const image = new ImageResponse(node, {
      width: options.width,
      height: options.height,
      fonts: options.fonts?.map((font) => ({
        name: font.name,
        data: font.data,
        weight: font.weight,
        style: font.style,
      })),
    });

    const headers = new Headers(image.headers);
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, value);
      }
    }

    return new Response(image.body, { status: image.status, headers });
  }
}
