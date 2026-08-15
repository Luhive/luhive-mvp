# Google Forms Integration Provider

This provider implements the IntegrationProvider pattern for Google Forms.

## Structure

- `data/` - Server-side Supabase and Google API queries
- `server/` - Loaders and actions
- `components/` - UI components (forms-list, google-sign-in-modal, etc.)
- `hooks/` - useGoogleForms and related hooks

## Adding New Providers (Tally, Notion, etc.)

Create a new folder under `providers/` with the same structure.
All providers conform to `~/modules/integrations/model/integration-types.ts`.
