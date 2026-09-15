# AGENTS.md

## Project

This repository is the Next.js App Router site for `diogomota.com`. Use React and follow the existing project structure. Keep changes focused, readable, responsive, and accessible.

## Non-negotiable UI boundary

There is one intentionally simple public page:

- `/` (`diogomota.com`)

Preserve its current minimal, text-first UI: dark background, monospace typography, compact centered content, plain links, and bracketed navigation. Do not turn it into a dashboard, marketing page, card grid, or highly styled product surface. Do not add decorative gradients, large navigation bars, hero sections, illustrations, or animations to the homepage unless explicitly requested.

Everything beyond the homepage should use a clean, modern React UI. This includes:

- The `/apps` product hub
- Login and registration screens
- Every individual app, including `/tvsync`, `/couple-planner`, and `/fithub`
- New authenticated/product routes added later

`/apps` is one product containing three smaller apps: TVSync, Couple Planner, and Fithub. It is not a minimal portfolio directory and should retain its polished app-picker UI. Users authenticate once with one shared account, then use that same identity across all three mini-apps.

## Design direction for auth and apps

- Build polished product interfaces with clear hierarchy, deliberate spacing, modern typography, and cohesive color and surface systems.
- Prefer reusable React components over duplicated markup.
- Give each app an interface suited to its purpose; do not force the minimal portfolio styling onto product screens.
- Keep visual choices restrained and intentional. Avoid generic template aesthetics, excessive effects, and unnecessary animation.
- Make all screens responsive from mobile through desktop.
- Include complete interaction states: hover, focus, active, disabled, loading, empty, error, and success where relevant.
- Use semantic HTML, visible keyboard focus, meaningful labels, and sufficient color contrast.
- Keep login and registration visually consistent with each other and make the current mode unmistakable.

## Styling isolation

The simple homepage and the modern product UI must be able to evolve independently.

- Do not add broad global element styles that unintentionally redesign `/`.
- Keep `app/globals.css` limited to resets, shared foundations, and the styles intentionally used by the simple public shell.
- Scope modern auth and app styles to route-specific wrappers, CSS Modules, or dedicated component styles.
- When changing shared layouts, verify that `/` remains simple and unchanged and that `/apps` retains its modern product UI.

## Architecture and behavior

- Prefer Server Components by default. Add `'use client'` only when a component needs browser APIs, local state, effects, or event handlers.
- Keep authentication and authorization checks on the server. Protected routes must remain protected and should redirect unauthenticated users to `/login`.
- Reuse shared auth actions and components rather than implementing separate login behavior per app.
- Treat `/apps` as the shared hub for one product with three mini-apps, not as three separate products or accounts.
- Use one Google login and one shared user identity across TVSync, Couple Planner, and Fithub; do not add per-app login flows.
- Preserve callback destinations so users return to the app they selected after authenticating.
- Treat login and registration as two presentation modes of the same Google-based authentication flow unless the product requirements change.
- Do not change authentication providers, environment variables, or deployment configuration without an explicit requirement.
- Do not expose secrets or commit `.env.local`.

## Current route map

- `app/page.js`: simple public homepage; preserve its visual language.
- `app/apps/page.js` and `app/apps/apps-client.js`: modern public product hub and app picker for the three mini-apps; authenticated and unauthenticated states share this route.
- `app/login/page.js`: modern login/register experience.
- `app/(protected)/layout.js`: server-side authentication boundary and initial per-app theme cookie reader.
- `app/components/app-shell.js`: scoped theme state and the single active-app header.
- `app/components/product-header.js`: shared app identity, section links, text-only Account panel, theme controls, Change app, and sign-out.
- `lib/app-sections.js` and `app/components/use-app-section.js`: app section definitions and fragment navigation.
- `app/(protected)/*`: modern app experiences; do not add nested app header bars or duplicate mobile navigation.
- `lib/fithub-model.mjs`: fitness state validation and legacy completion migration; shared with client initialization and tests.
- `lib/fithub.js` and `app/(protected)/fithub/actions.js`: per-user fitness database access and authenticated saves.

## Validation

For UI work:

1. Run `npm run build` and resolve errors introduced by the change.
2. Check `/` at mobile and desktop widths to confirm its simple UI was preserved.
3. Check the modern `/apps` hub, login, registration, and affected mini-app routes at mobile and desktop widths.
4. Verify keyboard navigation, focus visibility, dialog close behavior, and authentication redirects.
5. Preserve unrelated user changes already present in the working tree.

## Unified product navigation and preferences

- Keep `/apps` as a polished, footer-free picker. The homepage remains unchanged.
- Each mini-app has one header based on TVSync's established visual design:
  app identity, app-specific section links, and the visible word `Account` only.
  Do not add shared `dm/apps` branding or global app tabs to protected routes.
- Place Change app, per-app Light/Dark selection, and sign-out inside Account.
  Keep Escape/focus restoration, outside pointer/focus dismissal, and selection
  dismissal. Preserve partner management through Manage shared space.
- Use the shared fragment navigation definitions. On narrow screens keep the
  identity and Account accessible, with horizontally scrollable section links.
- Maintain TVSync's amber, Couple Planner's coral, and FitHub's green identities.
  Theme all surfaces and feedback, including TVSync media/season routes.
- Theme cookies (`app-theme-tvsync`, `app-theme-couple-planner`,
  `app-theme-fithub`) are browser preferences, not authentication. Read and
  validate them in the protected server layout. Set explicit CSS `color-scheme`
  selectors for both themes so the compiler's `light-dark()` fallback works;
  an inline color-scheme alone is insufficient for compiled color fallbacks.
- Keep public homepage/auth/hub styles isolated from protected theme preferences.

## FitHub state and history

- Reuse the existing `fithub_state.data` JSONB record and authenticated save action.
- `goalHistory` stores date-specific completion IDs. Migrate the legacy single-day
  fields on read; explicit history wins when present. Never drop history merely
  because a goal is edited or removed. Gym activity and workouts stay independent.
- Goals support add/edit/remove/undo and per-date completion. Validate names,
  dates, duplicates, and capacity on the server as well as in the form.
- Preserve save ordering, retry feedback, and unsaved-navigation protection.
  The existing full-state persistence is last-write-wins across tabs; do not
  describe it as conflict-safe. The checklist's current day is UTC.
- Habit squares must communicate dates and counts without relying on color,
  support arrow keys, and remain usable without causing mobile page overflow.

## Additional verification

- Run `npm run test:fithub` for migration and date/history regressions, plus the
  existing planner tests, encoding check, and production build.
- Check each mini-app in both themes at desktop/mobile widths. Assert rendered
  background/text colors, not just theme attributes; verify reload and app-switch
  persistence. Check the homepage and auth screens after product navigation.
- Verify one header per route, section URLs and browser history, Account keyboard
  navigation/Escape/outside dismissal, app switching, and sign-out callbacks.
- Verify goal CRUD, removal undo, independent dates, reload persistence, and both
  trackers against actual stored state when database access is available. Exercise
  pending/failed saves and retry. Use isolated temporary test identities and clean
  up their data; never use an existing user's records for destructive tests.
