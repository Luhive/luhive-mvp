/**
 * Local admin script to mint an API key.
 *
 * Runs in Node (not Workers) via tsx. Needs the service-role key in its env.
 *
 * Usage:
 *   pnpm create-key --kind partner  --name "Acme Partner"
 *   pnpm create-key --kind community --name "AZ Startup Community" --community <uuid> --scopes events:read,startups:read
 *
 * Env (from process.env, with a .dev.vars fallback):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { generateApiKey, type ApiKeyKind } from '../src/lib/api-key';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = 'true';
    }
  }
  return out;
}

function loadDevVarsFallback(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.dev.vars'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // no .dev.vars; rely on process.env
  }
}

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const DEFAULT_SCOPES: Record<ApiKeyKind, string[]> = {
  partner: ['public_events:read'],
  community: ['events:read'],
};

async function main() {
  loadDevVarsFallback();

  const args = parseArgs(process.argv.slice(2));
  const kind = args.kind as ApiKeyKind | undefined;
  const name = args.name;

  if (kind !== 'community' && kind !== 'partner') {
    fail('--kind must be "community" or "partner"');
  }
  if (!name) fail('--name is required');

  const communityId = args.community ?? null;
  if (kind === 'community' && !communityId) {
    fail('--community <uuid> is required for community keys');
  }
  if (kind === 'partner' && communityId) {
    fail('--community must not be set for partner keys');
  }

  const scopes = args.scopes
    ? args.scopes.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SCOPES[kind];

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (env or .dev.vars)');
  }

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const key = generateApiKey(kind);

  const { error } = await db.from('api_keys').insert({
    community_id: communityId,
    name,
    key_id: key.keyId,
    key_hash: key.keyHash,
    key_type: 'secret',
    key_kind: kind,
    scopes,
  });

  if (error) fail(`insert failed: ${error.message}`);

  console.log('\nAPI key created. Copy the raw key now - it is shown only once:\n');
  console.log(`  ${key.raw}\n`);
  console.log(`  kind:      ${kind}`);
  console.log(`  key_id:    ${key.keyId}`);
  console.log(`  community: ${communityId ?? '(none)'}`);
  console.log(`  scopes:    ${scopes.join(', ')}\n`);
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
