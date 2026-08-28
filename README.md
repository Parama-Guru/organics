# Organics

A production-ready storefront for certified organic groceries: catalog browsing, a persistent
basket, and guest checkout backed by PostgreSQL.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and Prisma.

## Quick start

```bash
cp .env.example .env      # adjust DATABASE_URL if needed
npm ci
docker compose up -d db   # or point DATABASE_URL at any Postgres 16 instance
npm run db:deploy         # apply migrations
npm run db:seed           # load the sample catalog
npm run dev
```

The app runs at http://localhost:3000.

## Running the whole stack in Docker

```bash
docker compose up --build
```

This starts Postgres and the app image. Migrations run automatically on container start
(`RUN_MIGRATIONS=true`), then seed the catalog once with `npm run db:seed`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` followed by a production build |
| `npm start` | Serve the production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:migrate` | Create a migration during development |
| `npm run db:deploy` | Apply pending migrations (used in deploys) |
| `npm run db:seed` | Load the sample catalog |

## Configuration

All variables are documented in [.env.example](.env.example). `DATABASE_URL` is the only one
without a usable default.

`NEXT_PUBLIC_*` values are inlined at build time. For Docker they must be supplied as build args
(`docker build --build-arg NEXT_PUBLIC_SITE_URL=...`); Render passes service environment variables
to the build automatically.

## Deployment

### Render (Docker blueprint)

[render.yaml](render.yaml) provisions a Docker web service plus a managed Postgres instance.
Create a new Blueprint from the repository, then set `NEXT_PUBLIC_SITE_URL` to the assigned URL.
Health checks hit `/api/health`, which verifies the database round-trips.

### Vercel

[vercel.json](vercel.json) runs `prisma generate && prisma migrate deploy && next build`. Vercel
does not run Docker images, so the Dockerfile is unused there. Add `DATABASE_URL` and the
`NEXT_PUBLIC_*` values in the project settings and point them at a pooled Postgres connection.

## Security notes

- Order totals are always recalculated on the server from live catalog prices; client-supplied
  prices are ignored.
- Stock is decremented with a conditional `UPDATE`, so concurrent checkouts cannot oversell.
- All request bodies and query strings are validated with Zod before use.
- Order creation is rate limited per IP and rejects cross-origin requests.
- Security headers, including a CSP, are set in [next.config.ts](next.config.ts).
- The container runs as a non-root user.
- Secrets live only in environment variables; `.env` is git-ignored and only `.env.example`
  is tracked.

### Known limitations

- Rate limiting is in-memory, so it is per-instance. Move it to Redis before scaling out.
- Checkout records orders but does not capture payment; wire in a payment provider before
  taking real money.
- The CSP allows `'unsafe-inline'` for scripts because Next.js injects inline bootstrap code.
  Tightening this requires nonce middleware.
