Personal website and a shared app product built with Next.js.

The homepage at `/` is the minimal public portfolio. `/apps` is a separate,
modern product hub containing three smaller apps:

- **TVSync** for movie and TV tracking
- **Couple Planner** for a shared two-person agenda
- **FitHub** for fitness progress

These are three experiences inside one app, not three separate account systems.
A user signs in once with Google and uses the same shared account across all
three mini-apps. `/apps` remains the central picker for moving between them.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide the Google OAuth, Neon, and
TMDB values needed by the apps. Secrets must remain in local or Vercel
environment variables and must never be committed.

The apps share one Neon Postgres database. Apply pending schema migrations with:

```bash
npm run db:migrate
```

`DATABASE_URL` is the pooled runtime connection. `DATABASE_URL_UNPOOLED` is the
direct connection preferred by the migration runner. TVSync also requires a
server-only `TMDB_API_KEY` for live discovery and search; without it, the route
shows an unavailable-catalogue notice and keeps the saved library accessible.

All product data is namespaced within that database: TVSync stores libraries,
ratings, and episode progress; Couple Planner stores a shared two-person space;
and FitHub stores each user's fitness state. The three mini-apps use one Google
login and the shared `app_users` identity, while keeping each mini-app's domain
records isolated.

## App navigation and themes

Each mini-app has exactly one sticky header: its own identity on the left,
its section links in the center, and a text-only **Account** button on the right.
TVSync uses Explore, Movies, TV Shows, and My Library; Couple Planner uses its
six planning sections; FitHub links to Activity, Daily goals, Habits, and Workout
plan. Section URLs use fragments (for example `/tvsync#library`). On smaller
screens, section navigation scrolls horizontally beneath the identity and Account
button. Couple Planner's **Manage shared space** action opens partner settings.

The Account panel contains **Change app**, **Light / Dark** theme selection, and
**Sign out**. Escape restores focus to Account; clicking or moving focus outside
the panel dismisses it. Change app returns to the footer-free `/apps` picker.
All three apps continue to share the same Google identity and server-side access
checks, including login callback destinations.

TVSync defaults to dark with amber accents. Couple Planner defaults to light
with warm coral accents; FitHub defaults to light with green accents. Each app
also supports the opposite theme, including forms, dialogs, feedback, and media
detail pages. A one-year, same-site `app-theme-<app>` cookie stores each app's
preference in the current browser. The protected server layout reads those
cookies for the first render, avoiding a theme flash on reload. Cookies contain
only `light` or `dark`; the homepage and public auth screens are not themed by
these preferences. Product colors and styles remain scoped to CSS Modules.

## FitHub daily goals

Add a daily goal such as **Drink 4 L of water**, **Walk 15,000 steps**, or **Go to
the gym**, with an optional reminder note. Use **Goal date** to review today or
an earlier date, and toggle each goal complete/incomplete for that date. Goals
can be edited or removed, with a short Undo opportunity after removal. Goal
names are required (up to 80 characters), notes allow 120 characters, and up to
100 active goals are supported. The current day follows the server's UTC date.

The two square calendars are independent:

- **Gym activity** retains the existing gym visit log and streaks.
- **Your habits over time** shows the number of completed daily goals per date.
  Choose a square to review the date; arrow keys move between squares. Each
  square has a date/completion label, visible count, and selected/focus state.
  Both calendars scroll horizontally on smaller screens.

State saves through an authenticated Server Action to the existing per-user
`fithub_state.data` JSONB record. `goalHistory` holds date-specific completion
IDs; existing `completedDate`/`completed` data migrates on read without a schema
migration. Editing or removing a goal preserves its recorded historical
completions. Removed goals no longer appear in the active checklist, but their
past completions still count in the habit calendar. History retains up to 3,660
date entries; the calendar displays the last year. Navigation within FitHub
preserves in-memory state. Saves are serialized, with saving/success/error
feedback and retry. Leaving through app links while a save is pending or failed
is prevented; browser reload/close warns about unsaved changes. As with the
existing fitness store, simultaneous writes from separate tabs use the last
saved full state; it is best to edit fitness data in one tab at a time.

## Checks

```bash
npm run check:encoding
npm run test:couple-planner
npm run test:fithub
npm run build
```

See `UX-VERIFICATION.md` for the browser coverage and local verification results.
