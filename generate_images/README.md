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
- **Landscape 1.6:1** for cards (`public/farms/`, `public/products/`), **4:5
  portrait** for the people on the home page.
- **Export WebP** at roughly 1600px on the long edge, quality 78. The card slots
  are at most 400px wide, so anything larger is bytes on a phone connection for
  no visible gain.
- **Daylight, no flash, no heavy filters.** The point is that it looks like the
  actual place.
- Replace the file **in place**, keeping the existing name and extension, or
  update the `photoUrl` on the record. Do not leave both.

---

## 1. `public/community/farmer.svg` → farmer portrait

Shown at the foot of the home page next to the count of registered farmers.

**Shot list.** A farmer who is actually listed on the site, standing in their own
field, holding a crate or bundle of what they grow. Waist-up, camera at chest
height, farmer looking at the lens. Morning or late-afternoon light. The crop
must be identifiable — this is the evidence, not the background.

**Prompt.**

> Documentary portrait photograph of a South Indian farmer in their forties
> standing in a small organic vegetable field in Tamil Nadu, holding a wooden
> crate of freshly picked tomatoes and greens. Waist-up framing, 4:5 portrait,
> shot on a 50mm lens at f/2.8, soft early-morning daylight, natural skin tones,
> no filter. Working clothes, a cotton shirt and a towel over the shoulder.
> Rows of crops and a coconut palm softly out of focus behind. Calm, direct,
> unposed expression, looking at the camera. Photojournalism, not advertising.

**Negative prompt.** `stock photo smile, studio lighting, white background,
plastic packaging, supermarket, western farm, tractor, wheat field, text,
watermark, oversaturated, HDR`

---

## 2. `public/community/buyer.svg` → buyer portrait

Shown beside the count of registered buyers.

**Shot list.** A customer at the point the site is about: carrying produce they
bought direct. A street or doorway, not a supermarket aisle — we are not a shop.

**Prompt.**

> Documentary portrait photograph of a South Indian woman in her thirties on a
> Tamil Nadu street, carrying a cloth bag of unpackaged vegetables over one
> shoulder, greens and a bunch of bananas visible at the top of the bag.
> Waist-up framing, 4:5 portrait, 50mm lens at f/2.8, soft daylight, natural
> skin tones. Everyday cotton kurta. A painted wall and a doorway softly out of
> focus behind. Relaxed, unposed, half-smiling, looking at the camera.
> Photojournalism, not advertising.

**Negative prompt.** `supermarket, trolley, plastic bags, branded packaging,
studio lighting, white background, stock photo smile, text, watermark,
oversaturated`

---

## 3. `public/farms/<slug>.svg` → one photograph per farm

There are seven of these, one per farm in the seed. Each is currently a
generated landscape. **These should not be generated at all** — take the
photograph on the verification visit. A farm page carrying a real picture of
that farm is the entire product.

**Shot list.** Wide establishing shot of the land, 1.6:1, taken from standing
height. Include whatever makes the place specific: the terracing at Coonoor, the
delta channels at Thanjavur, the shade trees at Madikeri.

If a visit is genuinely impossible, ask the farmer for a photo from their own
phone. A slightly crooked real photo beats a perfect fake one.

---

## 4. `public/products/<slug>.svg` → produce photographs

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

## 5. `public/hero.svg` → home page hero

The one image where an illustration is defensible, because it is decorative
rather than evidential. Replace it only if you have a genuinely good wide shot
of a Tamil Nadu farm at first light — otherwise leave it.

---

## Where each file is referenced

| File | Used by |
| --- | --- |
| `public/community/farmer.svg` | home page community band |
| `public/community/buyer.svg` | home page community band |
| `public/farms/<slug>.svg` | `Farmer.photoUrl`, set in `prisma/seed.ts` |
| `public/products/<slug>.svg` | `Product.imageUrl` and `ProductImage.url` |
| `public/hero.svg` | home page hero |

Organic stores have no image field yet. If you start photographing shopfronts,
add `photoUrl` to the store card select in `src/lib/stores.ts` — the column
already exists on the model.
