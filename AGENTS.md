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
- `app/(protected)/layout.js`: server-side authentication boundary and shared authenticated shell.
- `app/(protected)/*`: modern app experiences.

## Validation

For UI work:

1. Run `npm run build` and resolve errors introduced by the change.
2. Check `/` at mobile and desktop widths to confirm its simple UI was preserved.
3. Check the modern `/apps` hub, login, registration, and affected mini-app routes at mobile and desktop widths.
4. Verify keyboard navigation, focus visibility, dialog close behavior, and authentication redirects.
5. Preserve unrelated user changes already present in the working tree.
