# OSSIL

OSSIL is a bilingual directory for verified organic farms, produce, and
organic stores in Tamil Nadu. Tamil is the default language and English remains
available from the site-wide language switcher.

This is not a cart or checkout storefront. Visitors can browse produce freely;
buyer accounts unlock verified farm and store detail pages, private saved lists,
and private enquiries to sellers.

## What is included

- Public produce, farmer, and organic-store discovery with bilingual farmer and
  store search.
- Verified seller records, certification evidence, regions, and product listings.
- Buyer accounts with password and Google OpenID Connect sign-in.
- Redis-backed sessions, rate limits, OAuth state, and one-time verification/reset tokens.
- Member-gated farm and store details while product browsing stays public.
- Private customer-to-farmer/store enquiries with consent-controlled Reply-To.
- Farmer self-service portal at `/pannai`, including listings and a private
  buyer-enquiry inbox.
- Organic-store self-service portal at `/kadai`, including approved public
  profile edits and a private buyer-enquiry inbox.
- Staff operations portal at `/tj` for verification, listings, stores, buyers,
  enquiries, exports, sponsored placements, review flags, evidence editing,
  seller portal access, and durable review history.
- Time-bounded, explicitly labelled sponsored farmer and store placements with
  first-party daily aggregate impression and click totals.
- Tamil and English privacy, terms, cancellation, and refund pages.
- An original OSSIL editorial catalogue interface with a live index board,
  numbered specimen cards, responsive seller workspaces, and a staff command
  centre, in matched light and dark themes.
- A dormant Razorpay subscription path for a 14-day trial, ₹49 monthly plan,
  and ₹499 annual plan. Access remains free until billing and every required
  Razorpay setting are deliberately enabled.

## Technology

- Next.js 16 App Router, React 19, and strict TypeScript.
- Tailwind CSS 4.
- Prisma 6 with PostgreSQL.
- Redis through ioredis.
- Zod configuration and request validation.
- Nodemailer SMTP delivery.
- Standards-based Google OIDC through oauth4webapi.

Node.js 22 or newer is required.

## Visual direction

The interface is an original, bilingual field catalogue rather than a generic
storefront template. The palette is the Rich Heritage scheme, drawn from the
Indian flag and applied on the 60-30-10 rule: an ivory-cream canvas carries the
page, midnight-sapphire panels and rails carry structure, marigold orange is
reserved for action, and deep emerald marks anything that has been checked. The
home hero is a lightweight layered CSS/SVG index board with pointer
parallax—there is no WebGL, tracking script, or third-party animation runtime.

Light and dark are first-class. Every colour is a CSS custom property declared
in `@theme`, and a single `[data-theme="dark"]` block redeclares the same names,
so the whole application—public pages, account, and all three portals—flips
without per-component variants. The choice is stored in the `OSSIL_THEME`
cookie, read on the server so the first paint is already correct, and a small
inline script falls back to the operating-system preference when no cookie is
set. The header toggle writes both.

Instrument Serif and DM Sans provide the Latin display/body pairing, DM Mono is
used for evidence and operational labels, and dedicated Noto Tamil faces
preserve Tamil shaping and reading rhythm. Every face is an SIL Open Font
Licence release, self-hosted through `next/font`; no font, icon, or animation
library is fetched at runtime. Motion is decorative only, has reduced-motion and
coarse-pointer fallbacks, and revealed content remains visible without
JavaScript. The responsive and WCAG 2 A/AA browser matrix covers public,
account, farmer, store, and staff page families in both themes.

## Local setup

1. Copy `conf/config.example.yaml` to `conf/config.yaml`.
2. Keep secrets only in the ignored local file or environment variables. Never
   commit `conf/config.yaml` or a downloaded Google `client_secret*.json` file.
3. Set the PostgreSQL URLs in the local configuration. A local database can be
   started with `docker compose up -d db` and reached at
   `postgresql://organics:organics@localhost:5432/organics?schema=public`.
4. Install and initialize the application:

   ```bash
   npm ci
   npm run db:deploy
   npm run db:seed
   npm run dev
   ```

The development site runs at `http://localhost:3000` and redirects a first visit
to `/ta`.

Buyer accounts can use the in-process development session store. Set
`accounts.enabled` to `true` and provide a 32-character-or-longer session secret
in the local configuration. Production refuses to enable accounts without
shared Redis.

## Configuration

`conf/config.example.yaml` is the canonical, secret-free configuration reference.
It supports `${VAR}` and `${VAR:-fallback}` environment substitutions. Loading
order is:

1. `CONFIG_PATH`, when set.
2. `conf/config.yaml`.
3. `conf/config.example.yaml`.

Important feature switches fail safely:

- Empty account credentials disable the account area.
- Empty staff credentials disable the `/tj` tree.
- Empty Google credentials hide Google sign-in.
- Missing SMTP configuration disables external mail delivery.
- Billing remains free unless `BILLING_ENABLED=true` and both keys, the webhook
  secret, and both Razorpay plan IDs are present.
- Farmer phone numbers remain hidden while `SHOW_FARMER_PHONE=false`.

External callback endpoints:

- Google: `<site-url>/api/auth/google/callback`
- Razorpay: `<site-url>/api/billing/razorpay/webhook`

Generate a staff passphrase hash with `npm run admin:hash`; store the generated
hash and a separate random 32-character-or-longer session secret in configuration.
The staff sign-in intentionally asks only for that passphrase. The plaintext is
never stored. Seller portal invites also depend on the staff signing secret and
remain disabled when it is absent.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run committed unit, schema, request-security, ranking, and database-boundary tests |
| `npm run typecheck` | Generate route types and run TypeScript checks |
| `npm run config:check` | Validate the tracked configuration template |
| `npm run verify:boundary` | Exercise farmer listing ownership boundaries |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create a development migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:seed` | Load reference regions and sample directory data |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

### Render

`render.yaml` provisions the Docker web service and private Redis-compatible Key
Value service. PostgreSQL is supplied separately through `DATABASE_URL` and
`DIRECT_URL`. The container applies committed migrations before starting and
the health check verifies PostgreSQL plus Redis when accounts are enabled.

Values marked `sync: false` must be supplied in the Render dashboard. Keep
`BILLING_ENABLED=false` until Razorpay plans, hosted authorization, signed
webhooks, cancellation, and renewal behavior have passed test mode end to end.

### Vercel

`vercel.json` generates Prisma Client, applies committed migrations, and builds
the app. Configure PostgreSQL, Redis, account secrets, the public site URL, and
any optional Google/SMTP/Razorpay values in project settings.

### Docker

`docker compose up --build` starts PostgreSQL and the production-style web
container. The bundled example configuration reads runtime environment variables;
the ignored local configuration and downloaded OAuth files are excluded from the
image.

## Security and privacy boundaries

- Every mutation validates untrusted input. Authenticated mutations recheck the
  session and resource ownership server-side; public forms add origin checks
  and rate limits.
- Buyer and seller session cookies are HTTP-only, signed, and backed by
  server-side session records. Seller cookies are Strict and portal-scoped.
- Google sign-in uses Authorization Code, PKCE, state, and nonce. Provider tokens
  and profile photographs are not stored.
- Existing password accounts require explicit authenticated Google linking;
  matching an email alone never links identities.
- Seller contact, address, and certification details are excluded from public
  lists, metadata, sitemaps, and anonymous detail responses.
- Enquiry recipient addresses are resolved from verified database rows, never
  accepted from browser input. Enquiries are stored before SMTP is attempted;
  sellers see them only through an ownership-checked portal inbox.
- Staff decisions, evidence edits, and moderation flags produce a durable seller
  review timeline. A shared passphrase cannot identify an individual reviewer,
  so the audit record intentionally claims only what changed and when.
- Sponsored measurement stores one aggregate row per placement and India date;
  no visitor, account, IP, or user-agent is attached to the totals.
- CSV exports neutralize spreadsheet formulas and require a staff session.
- Razorpay webhooks use the unmodified request body, HMAC verification, and
  provider event IDs for replay protection.
- The application stores no card details. Razorpay hosts payment authorization
  when billing is eventually enabled.

## Production launch gates

Before enabling externally dependent features:

- Register the exact Google callback URI and configure the production client secret.
- Verify the sending domain and configure SMTP credentials and sender address.
- Configure DNS and the canonical `NEXT_PUBLIC_SITE_URL`.
- Exercise Razorpay creation, authorization, webhook, renewal, failure, and
  cancellation flows in test mode before enabling billing.
- Obtain seller consent before publishing farmer phone numbers.

Unresolved product decisions and externally blocked launch work are tracked in
`pending.md`.
