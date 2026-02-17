# BacklogBox

Media backlog tracker — track movies, series, books, games, and podcasts across customizable kanban boards.

Built with SvelteKit, Drizzle ORM, PostgreSQL, better-auth, Polar (subscriptions), and Tailwind CSS.

## Prerequisites

- [Node.js](https://nodejs.org/) 24+ (see `.node-version`)
- [pnpm](https://pnpm.io/) (`corepack enable`)
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Setup

```sh
pnpm install
cp .env.example .env
npx playwright install   # browser binaries for Vitest + E2E
```

Edit `.env` with your values. See [Environment Variables](#environment-variables) below.

### Database

```sh
pnpm db:start        # start PostgreSQL via Docker Compose
pnpm db:push         # push schema to DB (dev)
# or
pnpm db:migrate      # run migrations (production-style)
```

### Dev server

```sh
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

### Required

| Variable             | Description                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string. Default for local Docker: `postgres://root:mysecretpassword@localhost:5432/local`                             |
| `BETTER_AUTH_SECRET` | Session encryption key. Generate: `openssl rand -base64 32`. Works without in dev (uses default) but sessions won't persist across restarts |
| `POLAR_ACCESS_TOKEN` | [Polar](https://polar.sh) API token (use sandbox for dev)                                                                                   |

### Optional (features degrade gracefully without these)

| Variable                                               | What breaks without it                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`            | GitHub OAuth login unavailable. Callback URL: `http://localhost:5173/api/auth/callback/github` |
| `TMDB_API_KEY`                                         | Movie/series search returns no results                                                         |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET`            | Game search returns no results                                                                 |
| `POLAR_PRODUCT_ID_MONTHLY` / `POLAR_PRODUCT_ID_YEARLY` | Subscription checkout fails                                                                    |
| `POLAR_WEBHOOK_SECRET`                                 | Subscription status webhooks rejected                                                          |
| `RESEND_API_KEY`                                       | Verification/reset emails silently fail (errors logged)                                        |
| `EMAIL_FROM`                                           | Defaults to `BacklogBox <noreply@backlogbox.com>`                                              |
| `BETTER_AUTH_URL`                                      | Auto-detected; set when behind a proxy or using ngrok                                          |
| `TRUSTED_ORIGINS`                                      | `localhost:5173` always trusted; comma-separated list for additional origins                   |
| `ORIGIN`                                               | Only needed for production `adapter-node` builds                                               |

### Production-only

| Variable                           | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `SENTRY_DSN` / `PUBLIC_SENTRY_DSN` | Error tracking (no-ops when unset)              |
| `SENTRY_AUTH_TOKEN`                | Source map uploads during Docker build          |
| `AXIOM_TOKEN` / `AXIOM_DATASET`    | Log shipping (dev uses `pino-pretty` to stdout) |

## Webhooks & Tunneling

Polar sends subscription webhooks to `/api/auth/polar/webhook`. For local dev, you need a public tunnel:

```sh
ngrok http 5173
```

Then set in `.env`:

```
BETTER_AUTH_URL=https://<your-id>.ngrok-free.app
TRUSTED_ORIGINS=https://<your-id>.ngrok-free.app
```

And configure the webhook URL in your [Polar sandbox dashboard](https://sandbox.polar.sh) to `https://<your-id>.ngrok-free.app/api/auth/polar/webhook`.

> ngrok domains are already allowed in `vite.config.ts`.

### OAuth callbacks

GitHub OAuth callback URL is `/api/auth/callback/github`. Set this in your [GitHub OAuth App](https://github.com/settings/developers) settings — use `http://localhost:5173/api/auth/callback/github` for local dev (or your ngrok URL).

### Email links

Verification and password reset emails contain links based on `BETTER_AUTH_URL` (falls back to request origin). These work with `localhost:5173` when testing on the same machine — no tunnel needed unless testing from another device.

## Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start dev server                  |
| `pnpm build`       | Production build                  |
| `pnpm preview`     | Preview production build          |
| `pnpm check`       | Run `svelte-check`                |
| `pnpm lint`        | Prettier + ESLint                 |
| `pnpm format`      | Auto-format with Prettier         |
| `pnpm test:unit`   | Unit tests (Vitest)               |
| `pnpm test:e2e`    | E2E tests (Playwright)            |
| `pnpm db:start`    | Start PostgreSQL (Docker Compose) |
| `pnpm db:push`     | Push schema to DB                 |
| `pnpm db:generate` | Generate migration SQL            |
| `pnpm db:migrate`  | Run migrations                    |
| `pnpm db:studio`   | Open Drizzle Studio               |
| `pnpm auth:schema` | Regenerate better-auth schema     |

## Deployment

Deployed via Docker Swarm with Caddy reverse proxy. See `docker-stack.yml` and `.github/workflows/cd.yml`.

All secrets are created as Docker Swarm secrets and mounted at `/run/secrets/`. The `docker-entrypoint.sh` exports them as env vars at container startup.

### Required Swarm secrets

All of the following must be created with `docker secret create <NAME> -`:

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
| `SENTRY_DSN`               | Optional | Server-side error tracking                 |
| `PUBLIC_SENTRY_DSN`        | Optional | Client-side error tracking                 |
| `AXIOM_TOKEN`              | Optional | Log shipping                               |
| `AXIOM_DATASET`            | Optional | Log shipping                               |

The `SENTRY_AUTH_TOKEN` build arg is passed during CI (`docker build --build-arg SENTRY_AUTH_TOKEN=...`) for source map uploads and is not a runtime secret.
