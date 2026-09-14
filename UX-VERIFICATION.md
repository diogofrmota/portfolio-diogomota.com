# Unified apps UX verification

Verified on 2026-09-14 against the local production build at http://localhost:3100 using Chromium (agent-browser with Playwright over CDP).

## Results

- `npm run build`: passed before verification and after the accessibility fix.
- Desktop (1440 × 900) and mobile (390 × 900): `/`, `/apps`, `/login`, registration mode, `/tvsync`, `/couple-planner`, and `/fithub` rendered successfully. Protected routes were checked signed out and signed in. No document-level horizontal overflow was measured.
- `/` retains the dark background, monospace text, compact content, plain links, and bracketed apps navigation. `/apps` retains the modern public app picker required by AGENTS.md.
- Signed-out app routes redirect to `/login` with their callback destinations. Deep TVSync paths and Couple Planner invite query parameters survive switching login/register modes. External callback URLs are rejected.
- Signed-in `/apps` displays the shared identity and direct app links. Signed-in `/login` returns to the picker with the selected deep-link destination preserved.
- Switching among all three apps works at both widths and updates `aria-current`.
- Account menu: keyboard activation, Tab order, Escape with focus restoration, focus-out dismissal, and outside-click dismissal passed.
- Sign-out clears the session cookie, returns to signed-out `/apps`, and subsequent protected navigation redirects to login.
- TVSync details and Couple Planner activity dialogs: focus enters the dialog, Tab wraps, Escape restores trigger focus, and close buttons work at both widths.
- Visible keyboard focus checked on the public homepage, hub, login, and registration. Shared skip-to-content focus checked at both widths after the fix.
- The real Google sign-in server action produces an OAuth authorization handoff and preserves the intended app in the callback cookie.
- No browser console errors or uncaught page errors were recorded by the completed checks.

## Fix

Changed the shared header's skip link from Next.js `Link` to a native anchor. Before the fix, activating it updated the URL fragment but did not move keyboard focus into the main content. Native fragment navigation focuses the existing `tabIndex={-1}` main element.

## Scope and limitations

Signed-in verification used a short-lived, locally generated Auth.js session for a unique test identity against the configured database. Temporary identity records were deleted after each run. No authentication providers, environment files, or deployment settings were changed.

Google's outbound authorization navigation was intercepted after verifying its URL; interactive Google consent, authorization-code exchange, and a real Google account login were not exercised. Mini-app data editing and persistence beyond initial workspace reads/creation were outside this shared UX pass.

Screenshots and raw route results are available in `.next/ux-verification/` until the next build. The checked-in source change is limited to the skip link; pre-existing working-tree changes were preserved.
