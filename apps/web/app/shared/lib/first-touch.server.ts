const ALLOWED_SOURCES = new Set(["tools-ics-generator"]);

/**
 * Reads the first-touch attribution cookie written by free tools.
 * Client-set — parse defensively and allow-list sources only.
 */
export function readFirstTouchSource(request: Request): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;

  const match = header.match(/(?:^|;\s*)lh_first_touch=([^;]*)/);
  if (!match?.[1]) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(match[1]));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("source" in parsed)
    ) {
      return null;
    }

    const source = (parsed as { source: unknown }).source;
    return typeof source === "string" && ALLOWED_SOURCES.has(source)
      ? source
      : null;
  } catch {
    return null;
  }
}
