# Image briefs

Every picture on this site is currently a **generated vector illustration**, not
a photograph. That was a deliberate stopgap — it is better than stock photos of
someone else's farm — but it is the single biggest thing holding the site back.
A directory whose whole claim is "we checked this farm" is more convincing with
a photograph of that farm on it.

This folder holds the briefs. Each one is written as a prompt you can hand to an
image generator, **and** as a shot list you can hand to a photographer. Prefer
the photographer. If a real photo exists, use it; a generated image of a farmer
who does not exist is a small lie on a page about trust.

## Rules that apply to every image here

- **Consent in writing before publishing anyone's face.** Ask when you do the
  verification call, and record it in the farm's review note.
- **No stock photography of foreign farms.** Tamil Nadu, or nothing.
- **Landscape 1.6:1** for cards (`public/farms/`, `public/products/`).
- **Export WebP** at roughly 1600px on the long edge, quality 78. The card slots
  are at most 400px wide, so anything larger is bytes on a phone connection for
  no visible gain.
- **Daylight, no flash, no heavy filters.** The point is that it looks like the
  actual place.
- Replace the file **in place**, keeping the existing name and extension, or
  update the `photoUrl` on the record. Do not leave both.

---

## 1. `public/farms/<slug>.svg` → one photograph per farm

**This is the highest-value image on the site.** There are seven, one per farm in
the seed, and each is currently a generated landscape. **These should not be
generated at all** — take the photograph on the verification visit. A farm page
carrying a real picture of that farm is the entire product.

The banner is **1.6:1 landscape**, not a portrait. A 4:5 portrait dropped in here
is cropped to its middle band, losing both the sky and the crop at the farmer's
feet. If you want a farmer in the shot, frame it as a landscape with a person in
it, not as a portrait.

**Shot list.** Wide establishing shot of the land, 1.6:1, taken from standing
height. Include whatever makes the place specific: the terracing at Coonoor, the
delta channels at Thanjavur, the shade trees at Madikeri.

If a visit is genuinely impossible, ask the farmer for a photo from their own
phone. A slightly crooked real photo beats a perfect fake one.

---

## 2. `public/products/<slug>.svg` → produce photographs

Forty-odd of these. Lower priority than the farm and people shots: a competent
illustration of turmeric is honest, because nobody thinks it is a photograph of
the specific turmeric they will receive.

When you do replace them, shoot the produce **unstyled, on the surface it is
actually sold from** — a jute sack, a steel tray, a banana leaf. Not on white.

**Prompt template** (substitute the produce):

> Overhead photograph of {produce} arranged on a plain jute sack in daylight,
> 1.6:1 landscape, shot on a 35mm lens, soft diffused shade, natural colour, a
> little soil still on the vegetables. Unstyled and unretouched, as sold at a
> Tamil Nadu farm gate. No props, no packaging, no text.

**Negative prompt.** `white background, studio, plastic wrap, price tag, brand
label, glossy, artificial, text, watermark, hands`

---

## 3. `public/hero.svg` → home page hero

The one image where an illustration is defensible, because it is decorative
rather than evidential. Replace it only if you have a genuinely good wide shot
of a Tamil Nadu farm at first light — otherwise leave it.

---

## Where each file is referenced

| File | Used by |
| --- | --- |
| `public/farms/<slug>.svg` | `Farmer.photoUrl`, set in `prisma/seed.ts` |
| `public/products/<slug>.svg` | `Product.imageUrl` and `ProductImage.url` |
| `public/hero.svg` | home page hero |

Organic stores have no image field yet. If you start photographing shopfronts,
add `photoUrl` to the store card select in `src/lib/stores.ts` — the column
already exists on the model.
