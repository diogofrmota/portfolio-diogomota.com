Personal website and a shared app product built with Next.js.

The homepage at `/` is the minimal public portfolio. `/apps` is a separate,
modern product hub containing three smaller apps:

- **TVSync** for movie and TV tracking
- **Couple Planner** for a shared two-person agenda
- **Fithub** for fitness progress

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
renders a small preview catalogue.

All product data is namespaced within that database: TVSync stores libraries,
ratings, and episode progress; Couple Planner stores a shared two-person space;
and Fithub stores each user's fitness state. The three mini-apps use one Google
login and the shared `app_users` identity, while keeping each mini-app's domain
records isolated.
