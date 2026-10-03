# Codebase cleanup

## Admin portal integration

- Merged the complete `streamflix-admin` UI into `src/modules/admin`.
- Included all six administrative workspaces: Master Admin, Content, Comments, Feedback, Users, and System.
- Added `AdminPage.tsx` as the lazy-loaded admin entry point and workspace switcher.
- Added **Admin** to the signed-in StreamFlix desktop and mobile navigation.
- Added a persistent **StreamFlix** return action inside the admin portal.
- Reused the existing `public/streamflix_logo.svg` instead of copying duplicate PNG/JPG brand assets.
- Added `admin.css` with CSS `@scope` isolation so generic admin classes such as `.card`, `.input-field`, and `.btn-primary` do not affect the customer UI.
- Connected the admin theme aliases and remaining dark backgrounds to the canonical palette in `src/index.css`, keeping both interfaces visually consistent.
- Removed unused code found in the imported admin source and completed the System Manager pagination controls.
- Kept each manager workspace lazy-loaded so opening the customer experience does not eagerly download every admin bundle.

## Summary

The project was audited across its React, TypeScript, CSS, configuration, and package files. The cleanup removes duplicated catalog-page layers, dead code, unused APIs, and conflicting package-manager metadata while preserving the existing screens and user flows.

## Changes

### Consolidated catalog pages

- Added `src/modules/dashboard/CatalogPage.tsx` as the single implementation for Home, Movies, TV Shows, and New & Popular.
- Merged the duplicated catalog rendering and loading skeletons into reusable `CatalogView` and `LoadingCatalog` components.
- Replaced four nearly identical page wrappers and three pass-through view components with one `kind`-driven component.
- Removed the redundant catalog CSS modules; their only meaningful page styles are now expressed directly in the shared component.
- Simplified `Dashboard.tsx` so all catalog views use one render path.

Removed files:

- `src/modules/dashboard/home/Home.tsx`
- `src/modules/dashboard/home/components.tsx`
- `src/modules/dashboard/home/home.module.css`
- `src/modules/dashboard/movies/Movies.tsx`
- `src/modules/dashboard/movies/components.tsx`
- `src/modules/dashboard/movies/movies.module.css`
- `src/modules/dashboard/tvShows/TvShows.tsx`
- `src/modules/dashboard/tvShows/components.tsx`
- `src/modules/dashboard/tvShows/tvShows.module.css`
- `src/modules/dashboard/newAndPopular/NewAndPopular.tsx`
- `src/modules/dashboard/newAndPopular/components.tsx`
- `src/modules/dashboard/newAndPopular/newAndPopular.module.css`

### Removed dead code

- Removed the unused `MovieCard` component and its private `InfoIcon` helper.
- Removed CSS that was used only by the deleted movie card.
- Removed the unused `ChevronDownIcon` from the help module.
- Removed an unused `useRef` import from the account module.
- Removed unused `onNavigate` props from Account, Profile, and Help page interfaces.
- Removed the unused active-profile state from `App.tsx`; profile selection now navigates directly to the dashboard.

### Simplified data and rendering contracts

- Removed the unused `exploreAll` field from catalog feed definitions and `CatalogRow`.
- Replaced the always-true `(exploreAll || true)` expression with an unconditional See All button.
- Removed the redundant My List wrapper component; `Dashboard.tsx` now renders `MyListView` directly.
- Replaced the separate default React import in Settings with a type-only `ReactElement` import.

### Configuration and package cleanup

- Updated `vite.config.ts` to use `import.meta.dirname` instead of `__dirname`.
- Added the JSON import attribute required by Vite's native config loader.
- Removed `package-lock.json` because this project is configured for pnpm and already has `pnpm-lock.yaml`; keeping both lockfiles can produce different dependency resolutions.

## Verification

- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` passes.
- `npm run build` passes with no Vite configuration warnings.
- The production build now transforms 50 modules instead of 62.
- Generated JavaScript decreased from 427.39 kB to 424.83 kB, and generated CSS decreased from 94.56 kB to 93.21 kB.
