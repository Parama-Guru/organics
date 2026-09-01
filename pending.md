# Organics — running checklist

Updated as work lands. `[x]` = done and verified, `[ ]` = not done, `[~]` = done
but blocked on something outside the code.

**Score: 89 done · 8 blocked · 32 open**

Last updated: 2026-09-01 · full customer, seller, billing-safe and sponsorship phase verified

---

## Blocked — these stop the site going live

Nothing here is a code problem. Each needs a decision or an action in a
dashboard.

- [ ] **`ossil.in` has no DNS record.** Verified: *"DNS name does not exist"*.
      `NEXT_PUBLIC_SITE_URL` points at it, so canonical URLs, OG tags, the
      sitemap and password-reset links all target a dead host. Either register
      and point it at Render, or set `NEXT_PUBLIC_SITE_URL` to the
      `*.onrender.com` URL until it resolves.
- [ ] **`ADMIN_PASSWORD_HASH` is not set in Render.** It is `sync: false`, and
      Render only prompts for those at blueprint *creation* — it ignores them on
      every later sync. While empty, `/tj` returns 404 and the admin area cannot
      be reached at all. Generate with `npm run admin:hash`, paste into Render →
      Environment.
      The value must match `^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$` — exactly 168
      characters, one line, lower case. A malformed one no longer takes the site
      down (see below), but it does leave `/tj` unreachable, and the reason is
      printed in the Render logs starting `[config]`.
- [ ] **Confirm the `organics-kv` Key Value instance actually got created.**
      `REDIS_URL` now comes from `fromService`, which only resolves once the
      blueprint has synced. If it did not, `redis.url` is empty and the config
      refuses to boot in prod — the same boot loop as before.
- [ ] **Google OAuth credentials.** Create a Google Cloud OAuth 2.0 **Web
      application** and place `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in
      local config / Render Environment. Never paste the secret into chat or
      commit it. Redirect paths are listed below.
- [ ] **The supplied Google Web credential does not register an Organics
      callback.** Its redirects are for `127.0.0.1:5000` and two other Render
      services. Add `http://localhost:3000/api/auth/google/callback` and the real
      Organics Render/domain callbacks before Google can complete sign-in.
- [ ] **Rotate the pasted AMCS `jwt_secret` if that other application still
      uses it.** It was posted in chat and is compromised. It will not be copied
      into Organics; this app keeps its existing Redis-backed customer session.
- [ ] **Transactional email provider and verified sender domain.** Recommend
      Resend SMTP for the first launch. Verify `ossil.in`, then set
      `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM` in
      Render. Never paste the password/API key into chat.
- [ ] **Razorpay account configuration and provider-side testing are required
      before paid access can charge anyone.** The dormant integration is coded,
      but keys, plan IDs and a signed webhook test do not exist yet. Billing
      remains disabled, so customers retain free access instead of being trapped.

## Open — decisions needed from you

- [x] **Access model chosen: option 2.** Home, product lists, farmer lists and
      store lists stay public. Farm and organic-store detail pages require a
      customer account. During the 14-day trial or an active subscription they
      can see full details and contact actions.
- [x] **Product detail scope resolved.** Product pages remain public while seller
      details and contact actions enforce member access server-side.
- [x] **Disabled-billing behavior resolved.** Access fails open only when billing
      is explicitly disabled; enabled billing refuses incomplete configuration.
- [x] **Existing password account + same Google email resolved conservatively.**
      Google sign-in does not silently change that account's sign-in methods.
      The customer signs in with the password first and explicitly chooses
      “Link Google” from account security.
- [x] **User-to-seller email privacy resolved.** A verified buyer explicitly opts
      in before their email becomes Reply-To; otherwise staff relay responses by
      the stable enquiry reference.
- [x] **Sponsored ordering resolved.** Active sponsored entries sort first by
      priority and retain stable organic order, always labelled as advertising.
- [ ] **Social URLs.** Instagram, Facebook, LinkedIn, YouTube, WhatsApp. Icons
      render dimmed and unclickable until each is set in config.
- [ ] **Contact email.** Currently the literal `hello@ossil.in` in `render.yaml`.
      The mailbox may not exist yet.
- [ ] **Real photographs.** Briefs in `generate_images/README.md`. Farm banners
      are the highest value and are **1.6:1 landscape**, not portrait.

## Open — work I can do on request

- [ ] Store portal, the shop equivalent of `/pannai`, so shops edit their own
      entry instead of emailing an admin.
- [ ] Notify an admin when an application or message arrives. Today `/tj` has to
      be checked by hand.
- [ ] Search on the farmers page. Shops have it, farms do not.
- [ ] Add a permanent automated test suite. This phase used disposable runtime,
      migration, security and ownership harnesses; CI still lacks committed tests.
- [ ] Rotate the Supabase password, Redis URL and admin passphrase — they were
      pasted into chat earlier.
- [ ] Flip `SHOW_FARMER_PHONE` to `true` once farms consent. The whole value of
      the directory is gated behind it.
- [x] Password change signs out every session and the sign-in page explains why.
- [ ] Shop `photoUrl` column exists but is unused — wire it up when shopfront
      photos exist.

---

## Customer phase — access, Google sign-in and profile

### Access and entitlement
- [x] Add server-side entitlement states: `FREE_ACCESS`, `TRIAL`, `ACTIVE`,
      `PAST_DUE`, `CANCELLED`, `EXPIRED`.
- [x] Start one 14-day trial at the first completed customer sign-in once billing
      is enabled; disabled billing remains `FREE_ACCESS` and creates no fake trial.
- [x] Gate VERIFIED farmer and organic-store detail pages for anonymous visitors.
- [x] Preserve `?next=` through sign-up, password sign-in and Google OAuth,
      including onboarding and language changes.
- [x] Redirect an expired customer to the plan page, not to a generic 404.
- [x] Enforce entitlement on the server for every protected read and contact
      action; hiding a button in React is not access control.
- [x] Keep list pages public and remove protected detail URLs from the public
      sitemap if anonymous crawlers cannot read them.

### Google sign-in
- [x] Downloaded `conf/client_secret*.json` files are ignored before any OAuth
      work; the current file was confirmed untracked and is no longer eligible
      for `git add -A`.
- [x] Add a provider-identity table keyed by `(provider, providerAccountId)` and
      linked to the existing `Customer`; never use an email as the permanent
      Google identity key.
- [x] Allow password-only, Google-only and linked password+Google accounts.
- [x] Use Authorization Code + PKCE, state and nonce; store one-time state in
      Redis with a short TTL.
- [x] Validate Google's issuer, audience, signature, expiry, nonce and
      `email_verified` before linking an account.
- [x] Request only `openid email`; profile photo is not requested or stored.
- [x] After first Google sign-in, collect the normal profile fields in Organics:
      name, optional phone and district.
- [x] Add link/unlink Google controls to account security. Refuse to unlink the
      last sign-in method.
- [x] Record linked-provider status in the admin buyer view and CSV export, but
      never export OAuth tokens — no access/refresh token needs to be stored.

### Customer profile and UX
- [x] Rebuild sign-up, sign-in, profile, security and plan pages as one coherent
      glass-finished account experience, mobile first, with reduced-motion and
      opaque fallbacks.
- [x] Keep profile photo out entirely, as requested.
- [x] Add a clear trial/plan status card: days remaining, renewal date, price and
      cancellation state — no surprise renewal.
- [x] Fix password-change redirect so the customer sees why they were signed out.
- [x] Add account email verification for local password registrations.

---

## Customer phase — plans and billing

- [x] Plans: 14 days free, Starter Monthly ₹49/month, Starter Annual ₹499/year.
      Annual saves ₹89 versus twelve monthly payments (about 15%).
- [x] Add billing config with `enabled: false` by default; disabling billing must
      not strand customers behind an unusable paywall.
- [x] Add subscription/customer/payment-event records with provider IDs,
      idempotency keys, trial dates, current period and cancellation dates.
- [x] Add a dormant Razorpay Subscriptions path: server-created hosted
      authorization, durable provisioning attempts, reconciliation and safe
      cancellation. It remains inaccessible while billing is disabled.
- [x] Derive plan and price server-side and grant paid access only from a signed
      captured-charge webhook whose plan, amount, currency and cadence match.
- [x] Add a bounded raw-body webhook with current/previous-secret HMAC checking,
      event-ID replay protection, serialized out-of-order handling and monotonic
      paid-through entitlement.
- [x] Handle active, cancelled, past-due and expired states; access follows the
      stored server entitlement, not a client callback.
- [x] Add plan selection, hosted authorization result, localized billing history,
      exact access dates, persisted cancellation state and cancel-renewal UI.
- [ ] Update privacy/terms/refund copy before enabling real charges.

---

## Email phase — transactional mail and private contact relay

- [x] Extract one mail service from the password-reset-only implementation.
- [x] Send from the configured Organics sender; never forge a buyer's address in
      `From` because SPF/DMARC will reject it.
- [x] Keep password reset, then add local-account email verification.
- [x] Send application acknowledgements to farmers and organic stores.
- [x] Notify the admin address of new applications and contact messages.
- [x] Add an authenticated buyer-to-farmer/store enquiry model and form. Resolve
      sender from the session and recipient from a VERIFIED database record —
      never accept either email address from request JSON.
- [x] Store the enquiry before attempting SMTP, so a mail outage does not erase
      what the buyer wrote.
- [x] Plain text only for the first version; no attachments; rate limit per
      customer, IP and recipient.
- [x] Add delivery status, retry-safe message IDs and an admin view for failed
      deliveries.
- [ ] Add trial-ending / payment-failed mail only after live billing is tested. Razorpay
      invoices remain the gateway's responsibility.

---

## Sponsored placement and advertising

- [x] Add time-bounded promotions for either a VERIFIED farmer or VERIFIED
      organic store: starts, ends, priority, status and internal note.
- [x] Admin can create, pause and end a promotion; expired promotions disappear
      automatically.
- [x] Sponsored entries appear above organic results but preserve normal ordering
      within each group.
- [x] Label every paid placement “Sponsored / விளம்பரம்” in the card and detail
      page; verification badges remain visually separate.
- [x] Do not accept third-party ad scripts initially. First-party sponsored cards
      avoid tracking, layout shift, inappropriate ads and consent-banner work.
- [ ] Add impression/click counters without cross-site tracking; aggregate only.
- [ ] Add paid self-service promotion later, after customer subscriptions and
      webhook handling are stable.

---

## Credentials and dashboard setup needed

### Google Cloud OAuth 2.0 Web application
- [ ] Authorized JavaScript origins:
      `http://localhost:3000`, the real `https://<service>.onrender.com`, and
      `https://ossil.in` after DNS works.
- [ ] Authorized redirect URIs: the same three origins followed by
      `/api/auth/google/callback`.
- [ ] Configure consent screen: Organics, support email, privacy URL, terms URL,
      verified domain; scopes only `openid` and `email`.
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `conf/config.yaml`
      locally and Render Environment. Send neither secret through chat.

### SMTP — Resend recommended
- [ ] Verify `ossil.in` in Resend and add its SPF/DKIM DNS records.
- [ ] Render values: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`,
      `SMTP_USER=resend`, `SMTP_PASSWORD=<Resend API key>`,
      `SMTP_FROM=Organics <no-reply@ossil.in>`.
- [ ] Keep `CONTACT_EMAIL` as the monitored support inbox, which may differ from
      the no-reply sender.

### Razorpay — needed later, not for Google/mail work
- [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Create recurring plans for ₹49 monthly and ₹499 annual, then supply
      `RAZORPAY_MONTHLY_PLAN_ID` and `RAZORPAY_ANNUAL_PLAN_ID`.
- [ ] Webhook target will be `/api/billing/razorpay/webhook`.

---

## Done

### Organic stores
- [x] `OrganicStore` model + `StoreStatus` enum, migration and schema in step
- [x] `ContactMessage` model + `ContactRole` enum
- [x] Public directory at `/stores`, searchable by shop name and district
- [x] Shop detail page at `/stores/[slug]` — only VERIFIED resolve, others 404
- [x] Registration at `/stores/register` with FSSAI licence validation
- [x] `POST /api/stores` — same-origin, rate limited 3/hour, status not client-settable
- [x] Admin review queue at `/tj/stores` with approve / reject / suspend / delete
- [x] Five seeded shops across three new districts

### Contact
- [x] `/contact` with the role chooser: buyer, farmer, shop, other
- [x] Messages stored in the database, not emailed — mail is optional config
- [x] `POST /api/contact`, rate limited 5/hour
- [x] Admin queue at `/tj/messages`, unanswered first, oldest first

### Counts, footer, careers
- [x] Registered counts at the foot of the home page, printed exactly as counted
- [x] Portraits removed from the counts band, placeholders and dead keys deleted
- [x] Careers page — states there are no openings rather than inventing roles
- [x] Footer: four columns, contact and careers, five social icons
- [x] Social icons render dimmed and unclickable until a URL is configured

### Export
- [x] `/tj/export` + `/tj/export/download?type=` for buyers, farms, shops, messages
- [x] Streamed in batches of 500 via cursor pagination — no unbounded `findMany`
- [x] Every cell escaped against spreadsheet formula injection
- [x] UTF-8 BOM so Excel on Windows reads the Tamil columns
- [x] 401 without a session, 400 on an unknown type — both verified live

### Language
- [x] English re-enabled alongside Tamil; Tamil is still the default landing
- [x] Header toggle back, and it keeps you on the page you were reading
- [x] Sitemap emits hreflang alternates for both locales

### SEO
- [x] `sitemap.xml` from the database — 50 URLs, Tamil slugs percent-encoded
- [x] `robots.txt` as a route so its Sitemap line follows config, rendered per request
- [x] JSON-LD on farm and shop pages; telephone omitted while numbers are hidden

### Deployment and CI
- [x] Render boot loop diagnosed: `sync: false` is ignored on blueprint re-sync
- [x] Session secrets switched to `generateValue`, Redis to a Key Value service
- [x] `render.yaml` validated against Render's published JSON schema
- [x] Prisma migration history repaired after a shadow-database mistake
- [x] CI green on every commit — lint, config check, typecheck, build, Docker

### Fixes
- [x] `?next=` on the two detail pages, so signing in no longer loses the item
- [x] Shared `isSameOrigin` across all three write routes
- [x] Git history scanned — no credentials ever committed
- [x] A malformed `ADMIN_PASSWORD_HASH` no longer takes the public site down.
      It now behaves like an empty one: `/tj` 404s, the directory keeps serving,
      and the reason is logged. Verified against a trailing newline, a truncated
      paste, surrounding quotes and upper-case hex.
- [x] The Redis error message now names the likely cause — an unapplied
      blueprint — and the escape hatch, instead of just stating the rule.
- [x] Swept all 26 routes in both locales: every one returns 200, no console
      errors, `/api/health` reports `database: ok, redis: ok`. Whatever is
      failing on Render is environment, not code.
