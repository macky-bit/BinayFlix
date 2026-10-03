# StreamFlix admin architecture

The admin workspaces use the official Supabase browser client through the typed
repository layer in `data/`. UI components do not contain database queries.

## Structure

- `data/contracts.ts` defines resource names and repository contracts.
- `data/supabaseAdminRepository.ts` owns table mappings and CRUD operations.
- `data/AdminDataProvider.tsx` exposes repositories to every workspace.
- `data/useAdminCollection.ts` provides shared loading, error, and mutation state.
- `routes.ts` registers lazy-loaded workspaces and permission identifiers.
- Each manager folder owns its views and domain types.

## Configuration

Copy `.env.example` to `.env.local` and set the public Supabase project URL and
publishable key. Never add a service-role or secret key to a `VITE_` variable.

Authentication uses Supabase Auth. `AdminPage` calls `get_admin_role()` and only
loads the workspace assigned to that administrator; `masterAdmin` can load all
workspaces. Database row-level security remains the source of truth.

The schema and policies are tracked under `supabase/`. Apply new database
changes as additive migrations rather than editing production tables manually.
