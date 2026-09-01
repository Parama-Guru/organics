# Organics — running checklist

Updated as work lands. `[x]` = done and verified, `[ ]` = not done, `[~]` = done
but blocked on something outside the code.

**Score: 41 done · 7 blocked · 71 open**

Last updated: 2026-09-01 · customer access, billing and sponsorship phase planned

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
- [ ] **Rotate the pasted AMCS `jwt_secret` if that other application still
      uses it.** It was posted in chat and is compromised. It will not be copied
      into Organics; this app keeps its existing Redis-backed customer session.
- [ ] **Transactional email provider and verified sender domain.** Recommend
      Resend SMTP for the first launch. Verify `ossil.in`, then set
      `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM` in
      Render. Never paste the password/API key into chat.
- [ ] **A payment gateway is required before paid access can charge anyone.**
      Recommend Razorpay Subscriptions for INR recurring billing. Until its
      keys and plan IDs exist, billing will remain disabled and customers will
      retain access rather than being trapped behind an unpayable screen.

## Open — decisions needed from you

- [x] **Access model chosen: option 2.** Home, product lists, farmer lists and
      store lists stay public. Farm and organic-store detail pages require a
      customer account. During the 14-day trial or an active subscription they
      can see full details and contact actions.
- [ ] **[DOUBT] Product detail scope.** Recommendation: leave product detail
      pages public and gate only the farmer/store identity and contact action.
      Reason: products are what search engines and shared links discover; hiding
      them destroys most acquisition while adding little subscription value.
- [ ] **[DOUBT] What happens after trial while billing is disabled?**
      Recommendation: fail open — keep access free until Razorpay is configured.
      Reason: showing a payment wall with no working payment route is a dead end.
- [ ] **[DOUBT] Existing password account + same Google email.** Recommendation:
      link automatically only when Google's `email_verified` is true and the
      normalized email exactly matches. Reason: one customer record, no duplicate
      shortlist; the verified Google identity is strong enough for this link.
- [ ] **[DOUBT] User-to-farmer email privacy.** Recommendation: show the buyer a
      clear checkbox before putting their account email in `Reply-To`. Without
      consent, replies stay inside the Organics relay. Reason: neither party's
      private email should become public by accident.
- [ ] **[DOUBT] Sponsored placement ordering.** Recommendation: active sponsored
      entries first, then the existing relevance/alphabetical order; every one
      carries an unmistakable “Sponsored / விளம்பரம்” label. Reason: paid
      placement must never masquerade as verification quality.
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
- [ ] Automated tests. There are none.
- [ ] Rotate the Supabase password, Redis URL and admin passphrase — they were
      pasted into chat earlier.
- [ ] Flip `SHOW_FARMER_PHONE` to `true` once farms consent. The whole value of
      the directory is gated behind it.
- [ ] Password change signs you out with no explanation.
- [ ] Shop `photoUrl` column exists but is unused — wire it up when shopfront
      photos exist.

---

## Customer phase — access, Google sign-in and profile

### Access and entitlement
- [ ] Add server-side entitlement states: `FREE_ACCESS`, `TRIAL`, `ACTIVE`,
      `PAST_DUE`, `CANCELLED`, `EXPIRED`.
- [ ] Start one 14-day trial at the first completed customer sign-in; never reset
      it by signing out, changing email or linking Google.
- [ ] Gate VERIFIED farmer and organic-store detail pages for anonymous visitors.
- [ ] Preserve `?next=` through sign-up, password sign-in and Google OAuth.
- [ ] Redirect an expired customer to the plan page, not to a generic 404.
- [ ] Enforce entitlement on the server for every protected read and contact
      action; hiding a button in React is not access control.
- [ ] Keep list pages public and remove protected detail URLs from the public
      sitemap if anonymous crawlers cannot read them.

### Google sign-in
- [x] Downloaded `conf/client_secret*.json` files are ignored before any OAuth
      work; the current file was confirmed untracked and is no longer eligible
      for `git add -A`.
- [ ] Add a provider-identity table keyed by `(provider, providerAccountId)` and
      linked to the existing `Customer`; never use an email as the permanent
      Google identity key.
- [ ] Allow password-only, Google-only and linked password+Google accounts.
- [ ] Use Authorization Code + PKCE, state and nonce; store one-time state in
      Redis with a short TTL.
- [ ] Validate Google's issuer, audience, signature, expiry, nonce and
      `email_verified` before linking an account.
- [ ] Request only `openid email`; profile photo is not requested or stored.
- [ ] After first Google sign-in, collect the normal profile fields in Organics:
      name, optional phone and district.
- [ ] Add link/unlink Google controls to account security. Refuse to unlink the
      last sign-in method.
- [ ] Record linked-provider status in the admin buyer view and CSV export, but
      never export OAuth tokens — no access/refresh token needs to be stored.

### Customer profile and UX
- [ ] Rebuild sign-up, sign-in, profile, security and plan pages as one coherent
      glass-finished account experience, mobile first, with reduced-motion and
      opaque fallbacks.
- [ ] Keep profile photo out entirely, as requested.
- [ ] Add a clear trial/plan status card: days remaining, renewal date, price and
      cancellation state — no surprise renewal.
- [ ] Fix password-change redirect so the customer sees why they were signed out.
- [ ] Add account email verification for local password registrations.

---

## Customer phase — plans and billing

- [ ] Plans: 14 days free, Starter Monthly ₹49/month, Starter Annual ₹499/year.
      Annual saves ₹89 versus twelve monthly payments (about 15%).
- [ ] Add billing config with `enabled: false` by default; disabling billing must
      not strand customers behind an unusable paywall.
- [ ] Add subscription/customer/payment-event records with provider IDs,
      idempotency keys, trial dates, current period and cancellation dates.
- [ ] Integrate Razorpay Checkout / Subscriptions once keys and plan IDs exist.
- [ ] Verify checkout signatures server-side; never trust plan, amount or status
      returned by the browser.
- [ ] Add a webhook endpoint with signature verification, replay protection and
      idempotent event processing.
- [ ] Handle active, cancelled, past-due and expired states; access follows the
      stored server entitlement, not a client callback.
- [ ] Add plan selection, checkout result, billing history and cancel-renewal UI.
- [ ] Update privacy/terms/refund copy before enabling real charges.

---

## Email phase — transactional mail and private contact relay

- [ ] Extract one mail service from the password-reset-only implementation.
- [ ] Send from `Organics <no-reply@ossil.in>`; never forge a buyer's address in
      `From` because SPF/DMARC will reject it.
- [ ] Keep password reset, then add local-account email verification.
- [ ] Send application acknowledgements to farmers and organic stores.
- [ ] Notify the admin address of new applications and contact messages.
- [ ] Add an authenticated buyer-to-farmer/store enquiry model and form. Resolve
      sender from the session and recipient from a VERIFIED database record —
      never accept either email address from request JSON.
- [ ] Store the enquiry before attempting SMTP, so a mail outage does not erase
      what the buyer wrote.
- [ ] Plain text only for the first version; no attachments; rate limit per
      customer, IP and recipient.
- [ ] Add delivery status, retry-safe message IDs and an admin view for failed
      deliveries.
- [ ] Add trial-ending / payment-failed mail only after billing exists. Razorpay
      invoices remain the gateway's responsibility.

---

## Sponsored placement and advertising

- [ ] Add time-bounded promotions for either a VERIFIED farmer or VERIFIED
      organic store: starts, ends, priority, status and internal note.
- [ ] Admin can create, pause and end a promotion; expired promotions disappear
      automatically.
- [ ] Sponsored entries appear above organic results but preserve normal ordering
      within each group.
- [ ] Label every paid placement “Sponsored / விளம்பரம்” in the card and detail
      page; verification badges remain visually separate.
- [ ] Do not accept third-party ad scripts initially. First-party sponsored cards
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
