# Coding conventions (ground rules to keep the repo lean)

Four rules, chosen so the repo stays small as it grows. The theme: the source of truth is defined once, abstraction is earned not assumed, and idioms follow the runtime rather than fighting it.

## 1. Zod at the boundaries, inferred types inward

- Schemas are the single source of truth for anything crossing a trust boundary: request input, response DTOs, env, and any external data. Derive TypeScript types with `z.infer`; never hand-write a parallel `interface` for something a schema already describes.
- Do not add Zod validation to internal data that was already validated at the boundary. That is runtime cost for no benefit.
- One schema per concept. Derive variants with `.pick()`, `.omit()`, `.partial()`, `.extend()` from a base schema instead of writing several near-identical schemas. This is what prevents small types scattering across the repo.

## 2. Classes for state, functions for stateless behavior

- A class is warranted only when it holds state or injected dependencies. A service that wraps the Supabase client and a community context is a legitimate class, and gives the consistency and reuse a service-oriented style is after:

```ts
export class EventsService {
  constructor(private db: SupabaseClient, private communityId: string) {}
  list(filters: EventFilters) { /* every query scoped to this.communityId */ }
}
```

- Stateless helpers stay as plain exported functions in a cohesive module. A module is the namespace; `lib/api-key.ts` is the idiomatic equivalent of a utility class. Do not wrap stateless functions in static-only classes: it hurts tree-shaking (bundle size matters on Workers), adds ceremony, and is harder to test.
- No DI framework. Constructor arguments or a small context object are the entire dependency-injection story here.
- Do not add a repository layer over `supabase-js`. It is already the data-access abstraction; a service calls it directly, carrying the `community_id` scoping. A repository wrapper buys nothing in this stack.

## 3. Simplest thing first; patterns on the rule of three

- Introduce a design pattern only when a concrete second or third case creates real duplication or a genuine variation point. Never preemptively for a single implementation.
- Every new feature states its simplest approach first. A pattern is added only if it can answer one question: what does this abstraction buy us right now? "Flexibility we might need later" is a no.
- Discuss before adding any new abstraction layer.

## 4. Hono handler style (official best practices, reconciled with the service layer)

Hono's own guidance: do not write Ruby-on-Rails-style controllers, and split a growing app with `app.route()`. Applied here, with the one clarification that keeps it from looking like it contradicts rule 2.

- **Write handlers inline after the path, not as extracted controller functions.** Hono cannot infer path params or validated input types for a handler pulled into a separate named `(c) => ...` function without heavy generics, so an extracted controller silently loses type safety. Keep the handler in the route definition. (The foundation's `/v1/whoami` already does this.)
- **This does not contradict rule 2's service layer.** "No controllers" is about the HTTP handler that receives `c`; it is not "put business logic in the route." The inline handler stays thin: read validated input, call a service, map to a DTO, return. The logic lives in an HTTP-agnostic service (`EventsService`) that takes plain arguments and never touches `c`. In one line: **inline the handler, extract the logic.**

```ts
// routes/events.ts — handler inline, logic in the service
const events = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

events.get('/', zValidator('query', EventsQuery), async (c) => {
  const auth = c.get('auth');
  requireScope(auth, 'events:read');
  const svc = new EventsService(createSupabase(c.env), auth.communityId);
  const data = await svc.list(c.req.valid('query'));   // HTTP-agnostic logic
  return c.json(data.map(toPublicEvent));
});

export default events;
```

- **Split by resource with `app.route()`.** Each resource is a file exporting a `new Hono()` sub-app (`routes/events.ts`, `routes/startups.ts`, `routes/public.ts`), mounted in `app.ts`: `app.route('/v1/events', events)`. This is how the app grows without controllers, and it matches the structure above.
- **Escape hatch:** if you genuinely must bundle middleware with a handler as a reusable unit, use `factory.createHandlers()` from `hono/factory`, which preserves inference. Do not reach for it by default.
- **Future note:** if you later expose the typed RPC client (`hc`, a [non-goal](./14-non-goals.md)), chain the route methods and export `typeof app` as `AppType`. Worth knowing, not worth doing now.
