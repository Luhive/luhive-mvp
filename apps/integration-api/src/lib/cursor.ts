// Opaque keyset cursor over (start_time, id).

export function encodeCursor(startTime: string, id: string): string {
  return Buffer.from(JSON.stringify([startTime, id])).toString('base64url');
}

export function decodeCursor(
  raw: string,
): { startTime: string; id: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(decoded) &&
      decoded.length === 2 &&
      typeof decoded[0] === 'string' &&
      typeof decoded[1] === 'string'
    ) {
      return { startTime: decoded[0], id: decoded[1] };
    }
    return null;
  } catch {
    return null;
  }
}
