# Unified apps UX verification

## 2026-09-15: app headers, themes, and daily habits

Verified with Chromium against the local Next.js dev server at
`http://127.0.0.1:3000`, using agent-browser for the initial visual check and
Playwright for repeatable interaction checks. The production build also passed.

### Results

- Homepage: visually checked at desktop and mobile sizes; its source, layout,
  globals, and entry styles remain unchanged.
- Public `/apps`, login, and register mode: checked at 1440 and 390 px. The hub
  remains a modern picker and has no footer. No horizontal page overflow.
- Protected redirects: all apps and a deep TVSync route redirect to login while
  retaining their path/query callback, including a planner invite query.
- Each app: exactly one header with app identity, its own section links, and
  Account containing only text. Both themes checked at 1440 and 390 px, with
  rendered background colors verified in addition to preference attributes.
- Account: keyboard opening/tab navigation, visible focus, Escape with focus
  restoration, outside-pointer dismissal, theme-selection dismissal, reload
  persistence, Change app, and sign-out verified. Sign-out removes access to
  protected pages. Section links and browser Back navigation work.
- TVSync: discovery, library, movies/TV navigation, detail dialogs, movie/show
  detail routes, and season routes checked in both themes and screen sizes.
  Existing episode completion was also checked through save and reload.
- Couple Planner: all six sections checked with saved test content in both
  themes, including the add dialog and shared-space dialog. Partner management
  remains accessible after removing the sidebar and mobile header.
- FitHub: create/validate/edit/remove/undo goals, completion/uncompletion for
  two independent dates, reload persistence, date selection through habit
  squares, arrow-key square navigation, gym visits, and workouts verified.
  Direct database reads confirmed separate history dates, retained completions
  after goal deletion, and intact gym/workout records.
- FitHub save failure: a deliberately failed POST produced error/retry feedback;
  leaving via Change app was prevented until saving succeeded. Retrying and
  reloading retained the goal. Saves are serialized and no new authentication
  bypass or demo route was added.
- Automated accessibility: axe WCAG A/AA checks on app pages, Account panels,
  goal form, planner sections/dialog, and TVSync detail surfaces. Contrast
  issues found during verification were corrected. These checks supplement
  keyboard and visual checks; they are not a complete accessibility audit.
- Tests: 9 existing planner tests and 5 new FitHub state/history tests passed.
  Encoding and production build passed. No lint script exists in this repo.

### Test isolation and limitations

Authenticated tests used a temporary, locally signed session for a unique
`@example.invalid` test identity and the existing authenticated Server Actions.
Only that identity's test records were created/modified; they were removed after
verification. Real Google OAuth consent was not repeated. No provider, secret,
environment, migration, or deployment configuration was changed.

The existing fitness persistence remains last-write-wins between different tabs;
within a page, saves are ordered and pending/failed saves guard navigation.
Fitness dates follow UTC, and theme preferences are per browser and per app.
Screenshots and transient scripts were stored under ignored `.next/verification`;
no session tokens or credentials are included in tracked artifacts.

## Previous verification (2026-09-14)


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
