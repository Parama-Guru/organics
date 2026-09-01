# Organics — running checklist

Updated as work lands. `[x]` = done and verified, `[ ]` = not done, `[~]` = done
but blocked on something outside the code.

**Score: 36 done · 3 blocked · 13 open**

Last updated: 2026-09-01 · `main` @ `5fa92b1` · CI green

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

## Open — decisions needed from you

- [ ] **Login wall: pick 1, 2 or 3.** (1) everything behind login, (2) browse
      free but gate farm detail pages, (3) browse free, sign in only to save —
      what is built today. Recommend 3, or 2 if signups matter more than reach.
      Option 1 makes the sitemap/JSON-LD work pointless, since Google would see
      only a login form.
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
