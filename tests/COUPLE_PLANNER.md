# Couple Planner verification

Verified on 14 September 2026 against the local development server and the optimized production build.

## Repeatable checks

- `npm run build`
- `npm run test:couple-planner` — nine data-validation and collaboration regression tests; no database needed.
- `npm run test:couple-planner:db` — opt-in integration checks against the configured database. Creates uniquely identified test accounts and deletes only those accounts in a `finally` block. Requires the existing database schema and `.env.local` configuration.

## Verified flows

- Calendar: create multiple activities on one day, reload persistence, access overflow activities through the day agenda, edit, delete, and undo.
- Tasks: create, edit, complete, reopen, delete, undo, and partner updates.
- Dates, trips, recipes, entertainment: create and edit persisted items.
- Sharing: create and replace invite codes; copyable invite links; invite retained through the unauthenticated redirect; second account joins the same workspace; owner sees connection status update.
- Database authorization: another workspace cannot be read or written; only owners invite; two-member maximum; expired/replaced/used invites rejected; simultaneous joins and simultaneous saves handled safely.
- Collaboration: changes to different items merge; conflicting changes to the same item are rejected with recovery controls; partner deletions are not resurrected by unrelated saves.
- Recovery: offline save retains local changes, retry succeeds after reconnecting, and plans can be downloaded as JSON before discarding a conflicting local version.
- Accessibility: meaningful labels, whitespace validation, visible focus, focus containment, Escape closing, focus restoration, and background interaction blocked while dialogs are open.
- Responsive checks at 390px and 1440px: public homepage, public app directory, login, registration, and planner. No horizontal overflow or browser runtime/hydration errors in the final production checks.

The existing working tree routes `/apps` links to the login page; it does not contain an auth dialog. That behavior was preserved. Public pages and unrelated authentication edits were not modified by this work.

## Sharing after deployment

Open Couple Planner, choose **Invite your partner**, create a code, then choose **Copy invite link**. Your partner signs in with Google and chooses **Join space**. Invite codes are single-use and expire after seven days. Replacing a code invalidates the previous one. Joining an existing partner replaces a solo workspace, with a confirmation when it contains plans.

Changes save automatically. Partner updates refresh every 15 seconds while the page is visible, and when returning to the tab. Refresh pauses while an item editor is open so stale form values cannot silently overwrite a new partner edit. If a save fails, keep the page open and retry or download the plans before leaving.

## Verification boundary

Browser tests used two temporary signed test sessions with the normal authorization checks and real database persistence. A live Google consent/login flow and the deployed domain were not exercised. No deployment, authentication provider, environment configuration, or schema migration was changed. Test identities and their database records were removed after verification.
