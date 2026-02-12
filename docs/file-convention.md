# File Conventions

## Rules

- **kebab-case** for all `.ts` and `.tsx` filenames.
- **No dotted filenames** (e.g. `auth.verify.tsx`, `hub.repo.server.ts`). Use kebab: `auth-verify.tsx`, `hub-repo-server.ts`.
- **URL-like paths** for routes: prefer folder structure over flat dotted names.
- **Folderized organization**: group route and module files by domain (web, auth, api, etc.).
- **No wrapper re-exports**: import directly from the canonical file. Do not create passthrough files that only re-export.
- **Privacy for server related elements**: *.server.ts conversion should be followed for server elements (API Calls, Supabase calls). React Router V7 prevents leaking server elements to the client by using this convention

## Migration

- New files must follow these rules.
- Rename legacy files to kebab when you touch them.
- Update all imports when renaming.

## Examples

| Before           | After               |
|------------------|---------------------|
| `auth.verify.tsx`| `verify.tsx`        |
| `$slug.event.create.tsx` | `slug-event-create.tsx` |
| `LandingNavbar.tsx`      | `landing-navbar.tsx`     |
| `hub.repo.server.ts`     | `hub-repo-server.ts`     |
