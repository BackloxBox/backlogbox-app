# BacklogBox

Media backlog tracker — track movies, series, books, games, and podcasts across customizable kanban boards.

Built with SvelteKit 5, Drizzle ORM, PostgreSQL, better-auth, Polar (subscriptions), Redis, and Tailwind CSS 4.

## Tech stack

| Layer            | Tech                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Framework        | SvelteKit 5 (Svelte 5 runes, adapter-node)                               |
| Database         | PostgreSQL + Drizzle ORM                                                 |
| Cache / metrics  | Redis (ioredis) — optional in dev                                        |
| Auth             | better-auth (email+password, GitHub OAuth)                               |
| Subscriptions    | Polar.sh                                                                 |
| Styling          | Tailwind CSS 4, bits-ui, layerchart                                      |
| Search providers | TMDB (movies/series), IGDB (games), Open Library (books), Apple Podcasts |
| Logging          | pino → stdout (dev: pino-pretty, prod: JSON + Axiom)                     |
| Error tracking   | Sentry (client + server)                                                 |
| Analytics        | PostHog (client-side, proxied through Caddy)                             |
| PWA              | @vite-pwa/sveltekit (auto-update SW, image caching)                      |
| Deployment       | Docker Swarm, Caddy, GitHub Actions CD                                   |

## Prerequisites

- [Node.js](https://nodejs.org/) 24+ (see `.node-version`)
- [pnpm](https://pnpm.io/) (`corepack enable`)
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Quick start

```sh
pnpm install
cp .env.example .env      # edit with your values
pnpm db:start              # start PostgreSQL via Docker Compose (background: -d)
pnpm db:push               # push schema to DB
pnpm dev                   # http://localhost:5173
```

### Redis (optional in dev)

Redis is **not required** for local development. When `REDIS_URL` is unset, the app falls back to in-memory caching and metrics are disabled.

To run Redis locally:

```sh
docker run -d --name backlogbox-redis -p 6379:6379 redis:7-alpine \
  redis-server --save "" --appendonly no --maxmemory 64mb --maxmemory-policy allkeys-lru
```

Then add to `.env`:

```
REDIS_URL=redis://localhost:6379
```

### Playwright (for E2E tests)

```sh
npx playwright install
```

## Environment variables

### Required

| Variable             | Description                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string. Default for local Docker: `postgres://root:mysecretpassword@localhost:5432/local`                             |
| `BETTER_AUTH_SECRET` | Session encryption key. Generate: `openssl rand -base64 32`. Works without in dev (uses default) but sessions don't persist across restarts |
| `POLAR_ACCESS_TOKEN` | [Polar](https://polar.sh) API token (use sandbox for dev)                                                                                   |

### Optional (features degrade gracefully)

| Variable                                               | What breaks without it                                          |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`            | GitHub OAuth login unavailable                                  |
| `TMDB_API_KEY`                                         | Movie/series search returns no results                          |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET`            | Game search returns no results                                  |
| `POLAR_PRODUCT_ID_MONTHLY` / `POLAR_PRODUCT_ID_YEARLY` | Subscription checkout fails                                     |
| `POLAR_WEBHOOK_SECRET`                                 | Subscription status webhooks rejected                           |
| `RESEND_API_KEY`                                       | Verification/reset emails silently fail                         |
| `EMAIL_FROM`                                           | Defaults to `BacklogBox <noreply@backlogbox.com>`               |
| `BETTER_AUTH_URL`                                      | Auto-detected; set when behind a proxy or using ngrok           |
| `TRUSTED_ORIGINS`                                      | `localhost:5173` always trusted; comma-separated for additional |
| `ORIGIN`                                               | Only needed for production adapter-node builds                  |
| `REDIS_URL`                                            | No shared cache or API metrics (falls back to in-memory)        |

### Production-only

| Variable                                     | Description                                                     |
| -------------------------------------------- | --------------------------------------------------------------- |
| `SENTRY_DSN` / `PUBLIC_SENTRY_DSN`           | Error tracking (no-ops when unset)                              |
| `SENTRY_AUTH_TOKEN`                          | Source map uploads during Docker build (build arg, not runtime) |
| `AXIOM_TOKEN` / `AXIOM_DATASET`              | Log shipping to Axiom (dev uses pino-pretty to stdout)          |
| `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST` | PostHog analytics (proxied through Caddy at `/t/*`)             |
| `ADMIN_USER` / `ADMIN_PASS`                  | HTTP Basic Auth for `/admin` (skipped in dev)                   |

## Architecture

### Search & caching

Five search providers (TMDB, IGDB, OpenLibrary, Apple Podcasts) feed through a unified cache layer:

- **3 cache tiers**: `search` (5min), `trending` (30min stale / 2h expire), `similar` (30min stale / 4h expire)
- **Stale-while-revalidate**: stale entries returned immediately, refreshed in background
- **Request coalescing**: duplicate in-flight requests share a single fetch
- **Storage**: Redis when available, in-memory Map fallback
- **Rate limiting**: per-provider token bucket (TMDB 40/10s, IGDB 4/s, OpenLibrary 5/s)

### API metrics (Redis)

When Redis is connected, every external API call records metrics into hourly buckets:

- Fields per bucket: `cached`, `uncached`, `errors`, `latency_sum`, `latency_count`
- Key format: `metrics:<provider>:<YYYY-MM-DDTHH>` (auto-expire after 30 days)
- Queried by the admin dashboard for summary cards, per-provider breakdown, and a stacked area chart

### Auth

- **Email + password** with email verification (sent via Resend)
- **GitHub OAuth** (optional, enabled when client ID/secret are set)
- **Trial system**: auto-started after email verification
- **Subscriptions**: managed by Polar.sh (webhooks at `/api/auth/polar/webhook`)

### Admin dashboard (`/admin`)

- Protected by HTTP Basic Auth in production (skipped in dev)
- Shows: user growth, signups/items over time, user status breakdown, items by type, top users, API metrics (calls, cache hit rate, latency, errors per provider)

### Logging

- **pino** structured logger
- **Dev**: `pino-pretty` colorized output at `debug` level
- **Prod**: JSON to stdout at `info` level + Axiom transport when `AXIOM_TOKEN` is set
- **Request logging**: wide structured log per request (method, path, status, duration, userId). Warns on 4xx/slow requests, errors on 5xx.

### PostHog analytics

- Client-side only via `posthog-js`
- Session recording disabled
- Proxied through Caddy (`/t/*` → `eu.i.posthog.com`) to avoid ad blockers
- Initialized with `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST`

### PWA

- Auto-updating service worker via `@vite-pwa/sveltekit`
- Runtime caching (CacheFirst, 30-day expiry) for cover images from TMDB, IGDB, and OpenLibrary
- Standalone display, installable on iOS/Android

## Webhooks & tunneling

Polar sends subscription webhooks to `/api/auth/polar/webhook`. For local dev, use a tunnel:

```sh
ngrok http 5173
```

Then set in `.env`:

```
BETTER_AUTH_URL=https://<id>.ngrok-free.app
TRUSTED_ORIGINS=https://<id>.ngrok-free.app
```

Configure the webhook URL in [Polar sandbox](https://sandbox.polar.sh) to `https://<id>.ngrok-free.app/api/auth/polar/webhook`.

> ngrok domains are already allowed in `vite.config.ts`.

### OAuth callbacks

GitHub OAuth callback: `/api/auth/callback/github`. Set in [GitHub OAuth App settings](https://github.com/settings/developers) — use `http://localhost:5173/api/auth/callback/github` for local dev (or your ngrok URL).

### Email links

Verification and password reset links use `BETTER_AUTH_URL` (falls back to request origin). Work with `localhost:5173` on the same machine — no tunnel needed unless testing from another device.

## Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start dev server                  |
| `pnpm build`       | Production build                  |
| `pnpm preview`     | Preview production build          |
| `pnpm check`       | svelte-check (type check)         |
| `pnpm lint`        | Prettier + ESLint                 |
| `pnpm format`      | Auto-format with Prettier         |
| `pnpm test:unit`   | Unit tests (Vitest, watch mode)   |
| `pnpm test`        | Unit + E2E tests (single run)     |
| `pnpm test:e2e`    | E2E tests (Playwright)            |
| `pnpm db:start`    | Start PostgreSQL (Docker Compose) |
| `pnpm db:push`     | Push schema to DB (dev)           |
| `pnpm db:generate` | Generate migration SQL            |
| `pnpm db:migrate`  | Run migrations (production)       |
| `pnpm db:studio`   | Open Drizzle Studio               |
| `pnpm auth:schema` | Regenerate better-auth schema     |

## Deployment

Deployed via Docker Swarm with Caddy reverse proxy. See `docker-stack.yml` and `.github/workflows/cd.yml`.

### Infrastructure

- **Caddy** (manager node): TLS termination, gzip, static asset serving, PostHog proxy, www→bare domain redirect
- **Redis** (manager node): ephemeral cache (no persistence, 64MB LRU, 1 replica)
- **App** (worker node): 2 replicas, rolling updates (start-first), health check at `/healthz`
- **Static assets**: Caddy serves `_app/immutable/*` from disk with 1-year cache headers — prevents 404s during rolling deploys when different builds serve different hashed filenames

### CD pipeline

1. CI passes on `main` → triggers CD
2. Build & push Docker image to GHCR (with Sentry source maps)
3. SCP `docker-stack.yml` + `Caddyfile` to server
4. Run database migrations via `docker run` one-shot container
5. Extract `build/client/` from image to disk (for Caddy static serving)
6. `docker stack deploy` with rolling update

### Secrets

All runtime secrets created via `docker secret create <NAME> -` and mounted at `/run/secrets/`. The `docker-entrypoint.sh` exports them as env vars at container startup.

| Secret                     | Required | Notes                                      |
| -------------------------- | -------- | ------------------------------------------ |
| `DATABASE_URL`             | Yes      | Production Postgres connection string      |
| `BETTER_AUTH_SECRET`       | Yes      | `openssl rand -base64 32`                  |
| `BETTER_AUTH_URL`          | Yes      | e.g. `https://backlogbox.com`              |
| `ORIGIN`                   | Yes      | Same as `BETTER_AUTH_URL`                  |
| `TRUSTED_ORIGINS`          | Yes      | Comma-separated allowed origins            |
| `POLAR_ACCESS_TOKEN`       | Yes      | Production Polar token                     |
| `POLAR_PRODUCT_ID_MONTHLY` | Yes      | Polar product ID                           |
| `POLAR_PRODUCT_ID_YEARLY`  | Yes      | Polar product ID                           |
| `POLAR_WEBHOOK_SECRET`     | Yes      | From Polar webhook settings                |
| `GITHUB_CLIENT_ID`         | Yes      | Production GitHub OAuth App                |
| `GITHUB_CLIENT_SECRET`     | Yes      | Production GitHub OAuth App                |
| `TMDB_API_KEY`             | Yes      | themoviedb.org API key                     |
| `TWITCH_CLIENT_ID`         | Yes      | For IGDB game search                       |
| `TWITCH_CLIENT_SECRET`     | Yes      | For IGDB game search                       |
| `RESEND_API_KEY`           | Yes      | Transactional email                        |
| `EMAIL_FROM`               | Yes      | e.g. `BacklogBox <noreply@backlogbox.com>` |
| `ADMIN_USER`               | Yes      | HTTP Basic Auth username for `/admin`      |
| `ADMIN_PASS`               | Yes      | HTTP Basic Auth password for `/admin`      |
| `SENTRY_DSN`               | Optional | Server-side error tracking                 |
| `PUBLIC_SENTRY_DSN`        | Optional | Client-side error tracking                 |
| `AXIOM_TOKEN`              | Optional | Log shipping                               |
| `AXIOM_DATASET`            | Optional | Log shipping                               |
| `PUBLIC_POSTHOG_KEY`       | Optional | PostHog analytics                          |
| `PUBLIC_POSTHOG_HOST`      | Optional | PostHog API host                           |

`SENTRY_AUTH_TOKEN` is a build arg (passed during `docker build`), not a runtime secret. `REDIS_URL` is set as an environment variable in `docker-stack.yml` (`redis://redis:6379`), not a secret.
