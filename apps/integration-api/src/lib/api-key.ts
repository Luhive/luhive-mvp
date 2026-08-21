import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { SupabaseClient } from './supabase';

const ApiKeyRowBase = z.object({
  key_id: z.string(),
  key_kind: z.enum(['community', 'partner']),
  community_id: z.string().uuid().nullable(),
  scopes: z.array(z.string()),
  key_hash: z.string(),
  revoked_at: z.string().nullable(),
  expires_at: z.string().nullable(),
});

export const ApiKeyRow = ApiKeyRowBase.refine(
  (k) => (k.key_kind === 'partner') === (k.community_id === null),
  { message: 'partner keys must have a null community_id' },
);

export const ApiKeyContext = ApiKeyRowBase.omit({
  key_hash: true,
  revoked_at: true,
  expires_at: true,
});
export type ApiKeyContext = z.infer<typeof ApiKeyContext>;

export type ApiKeyKind = 'community' | 'partner';

const PREFIX_BY_KIND: Record<ApiKeyKind, 'sk' | 'pt'> = {
  community: 'sk',
  partner: 'pt',
};

const KEY_RE = /^luh_(sk|pt)_([0-9a-f]+)_([0-9a-f]+)$/;

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function parseKey(
  raw: string,
): { prefix: 'sk' | 'pt'; keyId: string; secret: string } | null {
  const match = KEY_RE.exec(raw.trim());
  if (!match) return null;
  return { prefix: match[1] as 'sk' | 'pt', keyId: match[2], secret: match[3] };
}

export function generateApiKey(kind: ApiKeyKind): {
  keyId: string;
  secret: string;
  keyHash: string;
  raw: string;
} {
  const prefix = PREFIX_BY_KIND[kind];
  const keyId = randomBytes(12).toString('hex');
  const secret = randomBytes(32).toString('hex');
  const keyHash = hashSecret(secret);
  return { keyId, secret, keyHash, raw: `luh_${prefix}_${keyId}_${secret}` };
}

function hashesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export async function verifyApiKey(
  db: SupabaseClient,
  raw: string,
): Promise<ApiKeyContext | null> {
  const parsed = parseKey(raw);
  if (!parsed) return null;

  const { data } = await db
    .from('api_keys')
    .select('key_id,key_kind,community_id,scopes,key_hash,revoked_at,expires_at')
    .eq('key_id', parsed.keyId)
    .maybeSingle();

  const result = ApiKeyRow.safeParse(data);
  if (!result.success) return null;
  const row = result.data;

  if (row.revoked_at !== null) return null;
  if (row.expires_at !== null && new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }

  if (!hashesEqual(hashSecret(parsed.secret), row.key_hash)) return null;

  return {
    key_id: row.key_id,
    key_kind: row.key_kind,
    community_id: row.community_id,
    scopes: row.scopes,
  };
}
