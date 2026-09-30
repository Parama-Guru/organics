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

### Railway

Create a Railway project from this GitHub repository and select `main`. Railway
detects the root `Dockerfile`; leave build and start command overrides empty so
the image's entrypoint applies committed migrations before starting Next.js.
Use one app replica, disable Serverless sleeping for an always-on site, set the
healthcheck path to `/api/health` with a 300-second timeout, and select an
on-failure restart policy with a bounded retry count. Set spending alerts and
resource limits before launch. Healthchecks gate deployment, not continuous uptime.

Add a Redis service in the same project and region, with persistent storage.
Use Railway's variable reference picker to connect the app's `REDIS_URL` to
Redis's private connection URL; do not reuse the previous host's Redis URL.
Keep the existing Supabase database and choose the nearest available app region.
Back up the database before deploying schema changes; migrations must remain
compatible with the old app during the transition. Do not run the sample seed.

Configure these app service variables before the first deployment:

| Variable | Value |
| --- | --- |
| `APP_ENV` | `prod` |
| `PORT` | `3000` (also use 3000 as the public networking target port) |
| `HOSTNAME` | `0.0.0.0` |
| `NEXT_PUBLIC_SITE_URL` | `https://ossil.in` |
| `NEXT_PUBLIC_CURRENCY` | `INR` |
| `NEXT_PUBLIC_LOCALE` | `en-IN` |
| `DATABASE_URL`, `DIRECT_URL` | Existing Supabase pooled and migration URLs |
| `DATABASE_POOL_LIMIT` | `3` initially |
| `REDIS_URL` | Reference to the new private Redis URL |
| `ACCOUNTS_ENABLED` | `true` |
| `ACCOUNTS_SESSION_SECRET`, `ADMIN_SESSION_SECRET` | Secure, independent secrets |
| `ADMIN_PASSWORD_HASH` | Generated with `npm run admin:hash` |
| `CONTACT_EMAIL` | A monitored mailbox, such as `hello@ossil.in` |
| `BILLING_ENABLED` | `false` until payment testing is complete |
| `SHOW_FARMER_PHONE` | `false` until seller consent is recorded |
| `RUN_MIGRATIONS` | `true` |

Transfer optional Google, SMTP and Razorpay settings securely as needed; the
complete variable mapping is in `conf/config.example.yaml`. Never commit secrets.
The Dockerfile declares the public build arguments Railway needs. Changes to
`NEXT_PUBLIC_*` values require a rebuild. Set a Node heap cap only in conjunction
with the chosen container memory limit, leaving room for native allocations.

Generate a Railway domain and test `/en`, `/api/health`, login and portal routes.
The health response must confirm database and Redis availability.
Before launch, verify the trusted proxy hop count against Railway's request
headers and set `TRUSTED_PROXY_HOPS` accordingly; test spoofed forwarding headers
and rate limiting. Do not assume an additional CDN is a trusted proxy by default.
Register any
temporary Google callback used during testing; production uses
`https://ossil.in/api/auth/google/callback`. Verify mail delivery separately.

For the domain cutover, remove GoDaddy domain forwarding (including masking).
Add `ossil.in` and `www.ossil.in` in Railway and copy its exact DNS records into
GoDaddy. If the apex record type is unsupported, follow Railway's current DNS
provider guidance; do not substitute an arbitrary IP. Preserve email MX/TXT
records. Verify both domains and HTTPS, and test `/tj/login` on the custom domain.
DNS mapping preserves URL paths; forwarding to a provider hostname does not.

Keep the previous host until DNS has propagated and the new deployment is stable.
New Redis means existing sessions and pending Redis tokens do not carry over.
Avoid account/security mutations during the overlap because the hosts have
independent sessions and rate limits. Then disable the old deployment and remove
unused resources. Removing a repository deployment file does not delete services.

Settings above are configured in Railway's dashboard. New services should not
use the deprecated `railway.json`/`railway.toml` Config as Code format. If automated
provisioning is needed later, import the configured project using Railway's current
Infrastructure as Code tooling and review its plan before applying changes.

### Cloudinary images

PostgreSQL remains the database; Cloudinary stores public images, not application
records. MongoDB is not required. Existing local images continue to work.

Set `CLOUDINARY_CLOUD_NAME` in Railway before building. The Docker build uses
this public account name to restrict Next.js image optimization and the browser
image policy to that account's HTTPS upload URLs. Rebuild when it changes.

For operator uploads, set `cloudinary.cloud_name`, `cloudinary.api_key` and
`cloudinary.api_secret` in the ignored `conf/config.yaml`. Alternatively, set
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in the
operator's ignored `.env` file. Environment variables override the YAML values.
Restart the local app after changing the cloud name. Do not put the key
or secret in `NEXT_PUBLIC_*` variables or Docker build arguments. No unsigned
upload preset or public upload endpoint is needed.

Check account access and the upload credit budget without uploading an asset or
opening a database connection:

```sh
npm run images:upload -- --check
```

Keep the API secret only in ignored local configuration or environment variables;
rotate credentials shared in chat and update the private configuration afterward.
The command reports safe errors without printing credentials. Missing credentials
or unavailable usage data block uploads. Automated transport tests use a mocked
Cloudinary SDK and do not prove that a real account is configured correctly.

Run against the intended database, using an existing record's slug:

```sh
npm run images:upload -- --kind product --slug PRODUCT_SLUG --file ./photo.jpg
npm run images:upload -- --kind farmer --slug FARMER_SLUG --file ./farm.webp
npm run images:upload -- --kind store --slug STORE_SLUG --file ./store.png
```

The command accepts JPEG/PNG/WebP/AVIF sources up to 10 MB and 40 million pixels.
Before uploading, it applies orientation, strips metadata (including GPS), and
converts to WebP with a maximum 1600px side, preserving aspect ratio and avoiding
upscaling. It tries quality 90, 85, then 80, accepting only outputs at most 200 KiB.
Images still above that budget are rejected, not silently degraded
further. Animated/multi-page sources are rejected. Compression is lossy; identical
pixels or perceptually identical results cannot be guaranteed. The source file
on your computer is not changed. Only the compressed buffer is uploaded.

The command updates the record's primary image URL. Product detail pages show this
image first and keep secondary gallery images, without duplicating the primary.
It does not migrate existing files, edit gallery
images, or upload private certificates. Previous assets are kept; failed database
updates report the uploaded asset ID for manual recovery. Cached catalogue data
refreshes within five minutes. Upload only images approved for public display.

With the local app running, execute `npm run images:verify` for a live account test.
It compresses a bundled illustration, checks credits, uploads one temporary image,
verifies exact CDN bytes and local Next.js delivery, rejects other accounts, and
deletes its test asset. It makes real API calls and consumes a small amount of
usage. Catalogue records are never changed. Set `BASE_URL` for another local port.
If cleanup fails, it reports the public asset ID for manual removal. Mocked tests
remain separate from live verification. Business email, OAuth and other launch
gates still apply; image verification does not certify the whole application.

The Cloudinary Free plan has 25 shared monthly credits. Our planning ceiling is
12.5 credits, not a guarantee: one credit covers 1 GB storage, 1 GB image bandwidth,
or 1,000 transformations. Compression happens locally; Cloudinary transformations
are not requested. Next.js caches optimized images for 30 days on the app's
ephemeral disk. Deploys and cold cache misses can fetch sources again. Keep URLs
versioned and unique; do not overwrite images at the same URL.

Example: 10,000 browsers fetching five 200 KiB source images each is about
10.24 GB before storage and other usage. Fifty such images per browser would
be about 102.4 GB. Actual cache hits reduce origin bandwidth but cannot be
assumed. A 200 KiB upload cap cannot guarantee half-plan usage or 10,000-user
capacity. Each operator upload checks Cloudinary usage through its Admin API,
and refuses uploads at 12 credits (or half the account allowance minus 0.5,
whichever is lower), reserving headroom below 12.5. Unknown usage blocks uploads.
This consumes one Admin API call per upload and is not a concurrent-upload lock
or a delivery bandwidth cutoff. Review Admin API rate limits before bulk uploads.
Monitor the Cloudinary dashboard at 10 credits, review unused assets,
and reassess traffic before 12.5. Cached delivery shifts bandwidth and image
processing costs to Railway; it does not eliminate hosting costs.

### Visitor counters

Apply committed migrations before running the new footer. Counts start from
zero and mean approximate distinct browsers, not people or pageviews. An HttpOnly
one-year cookie identifies the browser; only its hash and last India calendar day
are stored, alongside durable PostgreSQL aggregate counts. Clearing cookies,
multiple devices and bots can skew totals. Existing browsers count once per day;
new browsers increment total once. Counters are unavailable if database access
fails. DNT/GPC requests are not counted. Review analytics-cookie consent obligations
for your audience before launch. The endpoint's per-process rate limit assumes
one app replica; replace it with shared rate limiting before horizontal scaling.

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
