# Stage 1: Install production dependencies only
FROM node:24-alpine AS deps
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN corepack install && pnpm install --frozen-lockfile --prod

# Stage 2: Build the SvelteKit app
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN corepack install && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 3: Production runtime
FROM node:24-alpine
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build /app/scripts/cleanup-expired-trials.mjs ./scripts/cleanup-expired-trials.mjs
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "build"]
