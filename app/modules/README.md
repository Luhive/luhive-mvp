# Modules

Feature-first modules encapsulate domain logic, data access, and UI. Each module is self-contained and wired into routes via thin adapters.

## Structure

Each module follows this layout:

```
modules/<feature>/
  model/          Types, schemas, meta (SEO)
  data/           Repos: Supabase queries (server/client split)
  server/         Loaders, actions
  components/    Module-local UI
  hooks/          Custom hooks for stateful logic, subscriptions, CSR
  utils/          Module-local helpers (formatting, validation, etc.)
  page.tsx        Route entry component
```

## Responsibilities

| Folder        | Role                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `model/`      | TypeScript types, Zod schemas, `meta()` for route SEO                |
| `data/`       | Data access only. Supabase queries. No UI or route logic.            |
| `server/`     | Loaders/actions. Orchestrates auth + repo calls, returns route data. |
| `components/` | Presentational and composed UI used only by this module              |
| `hooks/`      | Custom React hooks (use-pending-community, use-form-state, etc.)     |
| `utils/`      | Pure helpers for this feature: formatters, validators, mappers       |
| `page.tsx`    | Top-level page; composes components and suspense/await flow          |

## Rules

- Routes re-export from modules (loader, meta, default). No business logic in `app/routes/*`.
- Components do not import Supabase directly. Data comes via props or loaders.
- Repos return `{ data, error }` shapes for consistent handling.

