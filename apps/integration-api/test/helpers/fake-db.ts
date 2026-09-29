// In-memory stand-in for the slice of the Supabase client the payment routes
// use. It understands only the calls those routes make, and fails loudly on
// anything else so a new query cannot silently pass a test.

export type FakeApiKeyRow = {
  key_id: string;
  key_kind: 'community' | 'partner';
  community_id: string | null;
  scopes: string[];
  key_hash: string;
  revoked_at: string | null;
  expires_at: string | null;
};

export type FakeOrderRow = {
  id: string;
  registration_id: string;
  community_id: string;
  amount_minor: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded';
  partner_reference: string | null;
};

export type FakeDbState = {
  apiKeys: FakeApiKeyRow[];
  orders: FakeOrderRow[];
  confirmResult: string;
  confirmError: { code: string; message: string } | null;
  confirmCalls: Array<Record<string, unknown>>;
  callbacks: Array<Record<string, unknown>>;
};

export function createFakeDbState(): FakeDbState {
  return {
    apiKeys: [],
    orders: [],
    confirmResult: 'confirmed',
    confirmError: null,
    confirmCalls: [],
    callbacks: [],
  };
}

type Filter = [column: string, value: unknown];

function matches(row: Record<string, unknown>, filters: Filter[]) {
  return filters.every(([column, value]) => row[column] === value);
}

function createQuery(table: string, state: FakeDbState) {
  const filters: Filter[] = [];
  let updateValues: Record<string, unknown> | null = null;

  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    },
    is: (column: string, value: unknown) => {
      filters.push([column, value]);
      return query;
    },
    update: (values: Record<string, unknown>) => {
      updateValues = values;
      return query;
    },
    insert: async (row: Record<string, unknown>) => {
      if (table !== 'payment_callbacks') {
        throw new Error(`Unexpected insert into ${table}`);
      }
      state.callbacks.push(row);
      return { error: null };
    },
    maybeSingle: async () => {
      if (table === 'api_keys') {
        const row = state.apiKeys.find((r) => matches(r, filters));
        return { data: row ?? null, error: null };
      }
      if (table === 'ticket_orders') {
        const row = state.orders.find((r) => matches(r, filters));
        return { data: row ?? null, error: null };
      }
      throw new Error(`Unexpected select from ${table}`);
    },
    // Awaiting an update chain applies it.
    then: (resolve: (value: { error: null }) => void) => {
      if (table !== 'ticket_orders' || !updateValues) {
        throw new Error(`Unexpected write to ${table}`);
      }
      for (const row of state.orders.filter((r) => matches(r, filters))) {
        Object.assign(row, updateValues);
      }
      resolve({ error: null });
    },
  };

  return query;
}

export function createFakeDb(state: FakeDbState) {
  return {
    from: (table: string) => createQuery(table, state),
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name !== 'confirm_ticket_order') {
        throw new Error(`Unexpected rpc ${name}`);
      }
      state.confirmCalls.push(args);
      if (state.confirmError) return { data: null, error: state.confirmError };
      return { data: state.confirmResult, error: null };
    },
  };
}
