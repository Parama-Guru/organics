# OSSIL — running checklist

Updated as work lands. `[x]` = done and verified, `[ ]` = not done, `[~]` = done
but blocked on something outside the code.

**Score: 182 done · 10 blocked · 15 open**

Last updated: 2026-09-02 · Home page 28% shorter, crop-index and cursor motion,
seller type chooser on /sell

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
      The passphrase posted in chat must not be used for production: chat is not
      a secret store. Run `npm run admin:hash`, type a new passphrase into the
      hidden terminal prompt, and store only its hash. The portal intentionally
      asks for that one passphrase and nothing else.
- [ ] **Confirm the `organics-kv` Key Value instance actually got created.**
      `REDIS_URL` now comes from `fromService`, which only resolves once the
      blueprint has synced. If it did not, `redis.url` is empty and the config
      refuses to boot in prod — the same boot loop as before.
- [ ] **Google OAuth credentials.** Create a Google Cloud OAuth 2.0 **Web
      application** and place `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in
      local config / Render Environment. Never paste the secret into chat or
      commit it. Redirect paths are listed below.
- [ ] **The supplied Google Web credential does not register an OSSIL
      callback.** Its redirects are for `127.0.0.1:5000` and two other Render
      services. Add `http://localhost:3000/api/auth/google/callback` and the real
      OSSIL Render/domain callbacks before Google can complete sign-in.
- [ ] **Rotate the pasted AMCS `jwt_secret` if that other application still
      uses it.** It was posted in chat and is compromised. It will not be copied
      into OSSIL; this app keeps its existing Redis-backed customer session.
- [ ] **Transactional email provider and verified sender domain.** Recommend
      Resend SMTP for the first launch. Verify `ossil.in`, then set
      `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_FROM` in
      Render. Never paste the password/API key into chat.
- [ ] **Razorpay account configuration and provider-side testing are required
      before paid access can charge anyone.** The dormant integration is coded,
      but keys, plan IDs and a signed webhook test do not exist yet. Billing
      remains disabled, so customers retain free access instead of being trapped.
- [ ] **Rotate the Supabase password, Redis URL and admin passphrase.** They were
      pasted into chat earlier, so this must be done in the provider dashboards.
      Update local/Render secrets after rotation; never send the replacements
      through chat.
- [ ] **Obtain recorded seller consent before exposing phone numbers.** After
      consent, set `SHOW_FARMER_PHONE=true` in local/Render configuration. The
      code path is complete but it must not be enabled on a developer's guess.

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

- [x] Store portal at `/kadai`, the shop equivalent of `/pannai`: one-time
      staff invite, password sign-in, immediate session revocation, permitted
      profile edits and an ownership-checked buyer-enquiry inbox.
- [x] Notify an admin when a farmer/store application or contact message
      arrives. Messages now link directly to the correct `/tj` queue once SMTP
      and a monitored `CONTACT_EMAIL` are configured.
- [x] Search on the farmers page by public farm name or district, in both
      languages, without turning private email/phone data into a search API.
- [x] Add a permanent automated test suite and run it in CI. It now covers
      passwords, India dates, schemas, request security, sponsored ordering and
      database-backed public seller boundaries.
- [x] Password change signs out every session and the sign-in page explains why.
- [x] Shop `photoUrl` now renders on directory cards, store detail pages, the
      staff review page and the store portal. Real photographs remain a media task.

---

## UI/UX rebuild — Living Farm Atlas

This is a full structural redesign, not a colour or glass pass. The direction is
an original animated field atlas: editorial storytelling, layered farm depth,
clear proof, and different information density for buyers, sellers and staff.

### Foundation and motion
- [x] Replace the current Latin display/body pairing with open-licensed
      Newsreader + DM Sans, retain dedicated Noto Tamil display/body faces, and
      add DM Mono for dates, evidence and operational labels.
- [x] Rebuild the colour system around warm paper, near-black ink, deep indigo,
      leaf green and one marigold action colour; remove saturated navy from long copy.
- [x] Replace repeated translucent glass cards with solid editorial paper,
      framed image fields, ruled ledger rows and intentional dark sections.
- [x] Add a shared type scale, section kicker, editorial headline, page-shell,
      feature-frame and operational-panel primitives.
- [x] Add viewport-triggered reveal choreography with staggered children,
      reduced-motion fallbacks and no layout shift.
- [x] Add slow ambient motion for decorative layers only; never animate essential
      controls or make content wait for animation.
- [x] Build an original CSS/SVG layered 3D farm world with pointer parallax,
      depth planes, crops, hills, sun, farmhouse and floating verification cards.
- [x] Keep the 3D scene static under reduced motion and on coarse pointers;
      maintain a fast first render without WebGL or third-party scripts.

### Public frame and home
- [x] Replace the full-width utility header with a floating capsule navigation,
      stronger wordmark, active-page pills and a compact mobile navigation rail.
- [x] Rebuild the footer as a dark editorial closing chapter with a large
      bilingual wordmark, clearer columns, legal links and restrained social states.
- [x] Replace the home hero with the living farm atlas, oversized bilingual
      promise, direct discovery actions and floating trust/provenance signals.
- [x] Replace the dense eight-card featured grid with alternating cinematic
      product stories using large images, farm provenance, price and one clear action.
- [x] Rebuild the verification explanation as a numbered horizontal field guide,
      not three equal generic cards.
- [x] Rebuild category discovery as a visual crop index with varied spans and imagery.
- [x] Rebuild farm discovery as large story cards with landscape photography and
      visible district/listing metadata.
- [x] Rebuild community counts as one compositional ledger band rather than three boxes.

### Browse and detail journeys
- [x] Rebuild the produce directory with an editorial page intro, anchored search,
      grouped filter studio, active-filter summary and calmer responsive grid.
- [x] Redesign product cards with larger 4:3 imagery, clearer name/provenance hierarchy,
      paper surfaces and less repeated microcopy.
- [x] Rebuild product detail as an image-led split story with a sticky buying/contact
      summary, trust ledger and related-produce chapter.
- [x] Rebuild farmer discovery with a large intro, integrated search and alternating
      landscape farm profiles instead of equal small cards.
- [x] Rebuild farmer detail as an immersive farm cover, verification dossier,
      direct-enquiry chapter and produce collection.
- [x] Rebuild store discovery with visible shopfront photography, integrated search
      and address-first local-business cards.
- [x] Rebuild store detail with a shopfront cover, location panel, licence dossier,
      contact chapter and clear sponsored/verification separation.
- [x] Add polished no-results and empty states that preserve context and provide one exit.

### Trust, forms and accounts
- [x] Rebuild “How we check” as a scrollable verification timeline with a strong
      limitation/caveat ending instead of repeated glass cards.
- [x] Rebuild farmer and store application pages as split editorial journeys with
      a sticky numbered guide beside a grouped, legible form.
- [x] Rebuild contact as a role-first conversation flow with a compact contact ledger.
- [x] Rebuild sign-in/sign-up around a two-panel editorial identity, clear Google/password
      separation and visible privacy/terms context.
- [x] Rebuild account home as a personal field notebook with navigation, access state,
      saved produce/farms, profile and security chapters.
- [x] Rebuild plans as a transparent two-option comparison with renewal/cancellation
      facts visually adjacent to every payment action.

### Seller and staff workspaces
- [x] Replace farmer `/pannai` top navigation with a responsive workspace shell,
      dashboard summary, clearer listing rows and prominent enquiry state.
- [x] Apply the same workspace language to store `/kadai` while preserving its
      profile/enquiry-specific information architecture.
- [x] Replace the crowded `/tj` top navigation with a desktop side rail and mobile
      scroll rail, keeping every operation keyboard reachable.
- [x] Rebuild `/tj/overview` into a scannable command centre with grouped urgency,
      proof health, seller access and support metrics.
- [x] Rebuild staff farmer/store review cards and detail pages around evidence,
      decision history, flags and portal controls rather than a flat data dump.
- [x] Standardize admin filters, pagination, empty states, dangerous actions and
      inline confirmation panels across every queue.

### Verification and release
- [x] Capture desktop and mobile screenshots for every redesigned page family and
      compare hierarchy, density, clipping and visual continuity.
- [x] Verify Tamil and English at 320, 375, 768, 1280 and 1920 widths with zero overflow.
- [x] Run WCAG 2 A/AA checks on public, account, seller and staff page families.
- [x] Verify keyboard navigation, focus order, reduced motion and coarse-pointer behavior.
- [x] Verify animation causes no horizontal overflow, content obstruction or cumulative
      layout shift and remains usable with JavaScript disabled where supported.
- [x] Re-run permanent tests, ownership checks, lint, typecheck, config validation,
      migration status, schema drift, production build and Docker CI.
- [x] Perform an independent visual, accessibility and regression review before commit.

---

## OSSIL rebrand and second visual rebuild

The Living Farm Atlas above shipped. This pass renames the product to OSSIL and
replaces the surface again, this time from tokens measured on live reference
pages rather than invented, and adds a real theme system.

### Extraction and licensing
- [x] Extract type scale, spacing rhythm, radii, easing curves and colour values
      with a headless browser from lassie.ai and saaspo.com; report them before
      writing any CSS.
- [x] Check the licence of every candidate face. ABC Marist is a paid Dinamo
      licence, so substitute Instrument Serif (SIL OFL) for display.
- [x] Add no new runtime dependency: no icon package, no animation library, no
      remote font or script.

### Brand
- [x] Rename OSSIL to OSSIL across copy, metadata, wordmarks, portals and the
      contact address, leaving lowercase infrastructure identifiers untouched.
- [x] Verify the Tamil dictionary survived the rename with no mangled glyphs.

### Palette and themes
- [x] Adopt the Rich Heritage palette (ivory cream canvas, midnight sapphire
      structure, marigold orange action, deep emerald verification) on the
      60-30-10 rule.
- [x] Express every colour as a `@theme` custom property so a single
      `[data-theme="dark"]` block retunes the whole application.
- [x] Add the `OSSIL_THEME` cookie, a server read for correct first paint, an
      inline OS-preference fallback and a header toggle with no hydration
      mismatch and no flash.
- [x] Migrate hard-coded light-only utilities (`bg-bark-900`, `bg-bark-50`,
      `bg-white`, `text-bark-900` on marigold) to theme-aware tokens so dark mode
      has no inverted pairing.
- [x] Verify both themes at 375 and 1280 across 20 paths in Tamil and English:
      zero WCAG 2 A/AA violations, zero horizontal overflow.

### Interface
- [x] Rebuild the header as a full-width bar with a scroll-lift state, serif
      wordmark, underline-slide navigation, language toggle and theme toggle.
- [x] Rebuild the home page around a live index board, an ink ticker of real
      districts and categories, a proof ledger, featured stories and a crop index.
- [x] Rebuild product cards as numbered catalogue entries with a single framed
      image treatment shared by farm and store artwork.
- [x] Add a live index strip to the shop that counts the listings, farms,
      districts and categories actually returned by the current filters.
- [x] Put the language toggle on all three portal sign-in screens without nesting
      a form inside the sign-in form.

### Security added in this pass
- [x] Shared client/server password strength scoring with a minimum score,
      personal-information and repetition checks on sign-up and both password
      change paths.
- [x] Live username availability with normalisation, pattern and reserved-word
      checks before any database lookup, and rate limiting on the endpoint.
- [x] `Customer.username` unique migration, deliberately not a sign-in credential.

---
## Member-only price and contact

Browsing stays open — names, farms, districts, categories, photographs and the
verification date are all public, so the directory is still worth indexing. What
a buyer would act on is not.

- [x] Hide the price from signed-out visitors on the product card, the featured
      home story and the product detail panel, replaced by a lock and a prompt.
- [x] Unlock price on exactly the condition that already unlocked contact, so the
      two can never disagree: accounts enabled, signed in, access allowed.
- [x] Drop `priceCents` from the public `/api/products` JSON for signed-out
      callers. Hiding it in the page while serving it in the API is not hiding it.
- [x] Neutralise `sort=price-asc|price-desc` for anyone who cannot see prices,
      since the ordering leaks what the values are, and hide the price sort chips.
- [x] Keep the price fully visible in the farmer, store and staff portals.
- [x] Verified signed out: zero `₹` on home, shop and detail in both locales, no
      `priceCents` anywhere in the HTML, no `tel:` link, and the API omits the
      field. Verified signed in: price, price sorting and contact all return.

---
## Density, motion and the seller chooser

Measured on the home page at 1440px before touching anything: the page was
6866px tall and "This week's pick" alone was 2137px of it — 31% of the page for
three items. The footer was another 703px in its own dark slab, directly below
the dark closing chapter, so the page ended in one heavy block after another.

### Density
- [x] Rebuild the featured story from a full-width alternating band (~450px each)
      into an upright card, and lay the three out in one row. 2137px → 704px.
- [x] Show three picks rather than four, so the row divides evenly and no card
      is orphaned onto a second line.
- [x] Compact the "Who is on OSSIL" band: heading beside the counts instead of
      above them, smaller figures, less padding. 374px → 258px.
- [x] Merge the footer into the page background — no dark slab, no rounded
      corners, one hairline rule — and drop the blurb that was printed twice.
      703px → 412px.
- [x] Home page total 6866px → 4930px, a 28% reduction, with nothing removed
      except the duplicated blurb.

### Motion
- [x] Keep the crop index alignment and add motion to it: a light sweep across
      the tile, a slower deeper image zoom, and the listing count rising into
      view on hover. The count is shown outright on touch and under reduced
      motion, because it is information rather than decoration.
- [x] Add a cursor companion: a ring that eases toward the pointer and widens
      over anything interactive. Position is written inside a rAF rather than
      through React state, so it costs no re-renders. It is `pointer-events:
      none`, is skipped entirely on coarse pointers, and is removed under
      reduced motion.
- [x] Take the hero index board out of the scroll-reveal wrapper. It sits above
      the fold, so it should never wait on an observer.
- [x] Give `Reveal` a failsafe timer. A fast flick or a restored scroll position
      can carry an element past an IntersectionObserver without it ever
      reporting, which would have left that content hidden for good.

### Seller chooser
- [x] `/sell` now asks whether you grow it or sell it and swaps in the farmer or
      the organic-store form. Driven by `?type=store` rather than client state,
      so the choice survives a reload, can be linked to, and works before the
      page hydrates. `/stores/register` still works as its own direct entry.
- [x] Translate the four labels that were hardcoded English on the two
      application pages — "Application field guide", "Your farm record",
      "Store review field guide", "Your store record" — which had been showing
      in English on the Tamil pages.

### Verification
- [x] 240 page loads and 96 axe runs across 24 paths, five widths, both themes
      and both languages: zero WCAG 2 A/AA violations, zero horizontal overflow,
      zero console errors.
- [x] Removed the ghosted footer wordmark. It was decorative text at 12% opacity
      that failed contrast on every single page, and it repeated the wordmark
      already directly above it.

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
- [x] After first Google sign-in, collect the normal profile fields in OSSIL:
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
- [x] Add bilingual privacy, terms, cancellation and refund copy, link it from
      sign-up/plans/footer, and describe disabled billing honestly. Legal review
      is still recommended before real charges are enabled.

---

## Email phase — transactional mail and private contact relay

- [x] Extract one mail service from the password-reset-only implementation.
- [x] Send from the configured OSSIL sender; never forge a buyer's address in
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
- [x] Add first-party daily impression/click aggregates with no visitor, account,
      IP or user-agent stored alongside the totals; show lifetime totals and CTR
      in `/tj/sponsored`.
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
- [ ] Configure consent screen: OSSIL, support email, privacy URL, terms URL,
      verified domain; scopes only `openid` and `email`.
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `conf/config.yaml`
      locally and Render Environment. Send neither secret through chat.

### SMTP — Resend recommended
- [ ] Verify `ossil.in` in Resend and add its SPF/DKIM DNS records.
- [ ] Render values: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`,
      `SMTP_USER=resend`, `SMTP_PASSWORD=<Resend API key>`,
      `SMTP_FROM=OSSIL <no-reply@ossil.in>`.
- [ ] Keep `CONTACT_EMAIL` as the monitored support inbox, which may differ from
      the no-reply sender.

### Razorpay — needed later, not for Google/mail work
- [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Create recurring plans for ₹49 monthly and ₹499 annual, then supply
      `RAZORPAY_MONTHLY_PLAN_ID` and `RAZORPAY_ANNUAL_PLAN_ID`.
- [ ] Webhook target will be `/api/billing/razorpay/webhook`.

---

## Done

### Seller portals and staff review
- [x] Store-owner portal at `/kadai` with invite/reset links, versioned sessions,
      profile management, sign-out/sign-in and immediate suspension/revocation.
- [x] Farmer and store portal inboxes expose only enquiries owned by that seller;
      buyer email remains hidden unless the verified buyer opted in.
- [x] Full staff detail pages for farmers and stores show application data,
      verification evidence, approval dates, portal state, related work and
      typed-confirmation deletion.
- [x] Staff can flag any farmer or store for review without changing public
      status, filter each queue to flagged records, and clear a resolved flag.
- [x] Status decisions, evidence edits and flag changes create a durable review
      timeline. Rejection/suspension requires a reason; approval re-validates
      current certificate/FSSAI evidence.
- [x] Store applications now collect a certificate expiry whenever optional
      organic certificate details are supplied, so incomplete evidence cannot
      be approved accidentally.

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
