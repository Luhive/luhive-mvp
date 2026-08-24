/**
 * Extracts the Supabase project ref from a Postgres connection URI.
 *
 * Direct connections carry it in the host (`db.<ref>.supabase.co`); pooler
 * connections carry it in the user (`postgres.<ref>`). Returns null for
 * anything else, so a non-Supabase URL never compares equal to a Supabase one.
 */
export function supabaseProjectRef(connectionString: string): string | null {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return null;
  }

  const user = decodeURIComponent(url.username);
  const fromUser = /^postgres\.([a-z0-9]{16,})$/.exec(user);
  if (fromUser) {
    return fromUser[1];
  }

  const fromHost = /^db\.([a-z0-9]{16,})\.supabase\.(co|com|net)$/.exec(
    url.hostname,
  );
  if (fromHost) {
    return fromHost[1];
  }

  return null;
}
