// Generates one distinct illustration per product and per farm.
// Run: npx tsx scripts/generate-artwork.mts
//
// These are not photographs and are not pretending to be. The point is that every
// SKU gets its own drawing of the actual item, so no two cards are ever identical
// and the honey never looks like a hillside.
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";

const W = 800;
// 1.6:1 matches the card's image slot, so a cover-crop trims ~2px instead of 34.
const H = 500;

type Palette = {
  bg: [string, string];
  item: string;
  itemDark: string;
  itemLight: string;
  accent: string;
};

const round = (n: number) => Math.round(n * 100) / 100;

// Flat fills on a pale wash measured 1.0-1.9:1 and 0% dark pixels, so the tiles
// read as failed image loads. Every subject now gets an outline derived from its
// own darkest fill, which is what gives a flat illustration its ink.
function darken(hex: string, factor: number): string {
  const v = hex.replace("#", "");
  const parts = [0, 2, 4].map((i) => Math.round(parseInt(v.slice(i, i + 2), 16) * factor));
  return `#${parts.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("")}`;
}

function relLuminance(hex: string): number {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// Scales a colour to a target relative luminance, keeping its hue. Palettes are
// hand-picked per product and vary wildly in lightness (white milk, near-black
// urad), so a fixed multiplier produced grounds ranging from slate to pale grey.
function deepen(hex: string, target: number): string {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (relLuminance(darken(hex, mid)) > target) hi = mid;
    else lo = mid;
  }
  return darken(hex, (lo + hi) / 2);
}

/**
 * Every tile is a deep ground with a light plate in the middle and the produce
 * drawn on the plate.
 *
 * The previous near-white wash measured mean luminance 214/255 with SD 30 over
 * real pixels — at the card's 164x103 slot that reads as a failed image load.
 * Making contrast structural rather than leaving it to however large a given
 * motif happens to be is what fixes it for all 33 at once.
 */
function backdrop(p: Palette, seed: number, grounded: boolean): string {
  const cx = 120 + ((seed * 37) % 240);
  const cy = 90 + ((seed * 53) % 120);
  const r = 150 + ((seed * 29) % 90);
  return `
  <rect width="${W}" height="${H}" fill="url(#wash)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="0.07"/>
  <circle cx="${W - cx * 0.7}" cy="${H - cy * 0.5}" r="${round(r * 0.8)}" fill="${p.itemLight}" opacity="0.1"/>
  <circle cx="400" cy="250" r="222" fill="${p.accent}" opacity="0.22"/>
  <circle cx="400" cy="250" r="212" fill="#fdfaf4"/>${
    grounded
      ? `\n  <ellipse cx="400" cy="${H - 118}" rx="150" ry="20" fill="#000" opacity="0.07"/>`
      : ""
  }`;
}

// ---- motifs. Each returns SVG drawn around (400, 320) at roughly 360x300. ----

const motifs: Record<string, (p: Palette, seed: number) => string> = {
  leafy: (p, seed) => {
    const blades = [-38, -18, 0, 18, 38];
    return blades
      .map((angle, i) => {
        const h = 190 + ((seed + i * 7) % 40);
        const fill = i % 2 === 0 ? p.item : p.itemDark;
        return `<g transform="translate(400 430) rotate(${angle})">
        <path d="M0 0 C -46 -${round(h * 0.55)} -40 -${h} 0 -${h + 26} C 40 -${h} 46 -${round(h * 0.55)} 0 0 Z" fill="${fill}"/>
        <path d="M0 -6 L0 -${h + 10}" stroke="${p.itemLight}" stroke-width="4" stroke-linecap="round" opacity="0.75"/>
      </g>`;
      })
      .join("");
  },

  roundFruit: (p) => {
    const spots = [
      { x: 300, y: 340, r: 92 },
      { x: 470, y: 320, r: 104 },
      { x: 392, y: 438, r: 80 },
    ];
    return spots
      .map(
        (s, i) => `<g>
      <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${i === 1 ? p.item : p.itemDark}"/>
      <ellipse cx="${s.x - s.r * 0.32}" cy="${s.y - s.r * 0.36}" rx="${round(s.r * 0.3)}" ry="${round(s.r * 0.22)}" stroke="none" fill="#fff" opacity="0.3"/>
      <path d="M${s.x} ${s.y - s.r} q -14 -22 -34 -28 q 22 -6 34 8 q 12 -14 34 -8 q -20 6 -34 28 Z" fill="${p.accent}"/>
    </g>`,
      )
      .join("");
  },

  berries: (p, seed) => {
    const out: string[] = [];
    for (let i = 0; i < 11; i++) {
      const x = 270 + ((i * 53 + seed * 11) % 270);
      const y = 300 + ((i * 71 + seed * 17) % 150);
      const r = 26 + ((i * 13 + seed) % 12);
      out.push(
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 === 0 ? p.itemDark : p.item}"/>
         <circle cx="${round(x - r * 0.3)}" cy="${round(y - r * 0.35)}" r="${round(r * 0.24)}" stroke="none" fill="#fff" opacity="0.32"/>
         <path d="M${x} ${y - r} l -6 -9 l 12 0 Z" fill="${p.accent}"/>`,
      );
    }
    return out.join("");
  },

  bunch: (p, seed) => {
    const out: string[] = [];
    const rows = [4, 3, 2, 1];
    let y = 300;
    for (const count of rows) {
      const startX = 400 - ((count - 1) * 62) / 2;
      for (let i = 0; i < count; i++) {
        const x = startX + i * 62;
        out.push(
          `<circle cx="${x}" cy="${y}" r="34" fill="${(i + count + seed) % 2 === 0 ? p.item : p.itemDark}"/>
           <ellipse cx="${x - 10}" cy="${y - 12}" rx="9" ry="6" stroke="none" fill="#fff" opacity="0.32"/>`,
        );
      }
      y += 56;
    }
    return `<path d="M400 300 l -16 -66 q 44 -30 74 -6 q -30 4 -46 26 Z" fill="${p.accent}"/>${out.join("")}`;
  },
  curved: (p) => {
    // Bananas, gourds, okra, chillies: repeated curved bodies.
    const items = [
      { dx: -78, rot: -14, len: 1 },
      { dx: 0, rot: -2, len: 1.1 },
      { dx: 78, rot: 12, len: 0.95 },
    ];
    return items
      .map(
        (it, i) => `<g transform="translate(${400 + it.dx} 360) rotate(${it.rot})">
      <path d="M-26 -${round(120 * it.len)} q 60 ${round(110 * it.len)} 6 ${round(216 * it.len)} q -52 -${round(96 * it.len)} -44 -${round(214 * it.len)} Z"
            fill="${i === 1 ? p.item : p.itemDark}"/>
      <path d="M-20 -${round(110 * it.len)} q 44 ${round(104 * it.len)} 2 ${round(196 * it.len)}"
            stroke="${p.itemLight}" stroke-width="6" fill="none" opacity="0.55" stroke-linecap="round"/>
    </g>`,
      )
      .join("");
  },

  root: (p) => {
    const items = [
      { dx: -92, rot: -13 },
      { dx: 0, rot: 0 },
      { dx: 92, rot: 13 },
    ];
    return items
      .map(
        (it, i) => `<g transform="translate(${400 + it.dx} 300) rotate(${it.rot})">
      <path d="M-34 0 L34 0 L14 210 q -14 22 -28 0 Z" fill="${i === 1 ? p.item : p.itemDark}"/>
      <path d="M-18 44 L18 44 M-14 96 L16 96 M-10 148 L12 148" stroke="${p.itemLight}" stroke-width="5" opacity="0.5" stroke-linecap="round"/>
      <path d="M0 0 q -34 -56 -10 -84 q 12 26 10 60 q 16 -34 40 -46 q -18 32 -26 70 Z" fill="${p.accent}"/>
    </g>`,
      )
      .join("");
  },

  floret: (p, seed) => {
    const out: string[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rr = 62 + ((i * 17 + seed) % 34);
      const x = round(400 + Math.cos(a) * rr);
      const y = round(300 + Math.sin(a) * rr * 0.72);
      out.push(
        `<circle cx="${x}" cy="${y}" r="${34 + (i % 3) * 6}" fill="${i % 2 === 0 ? p.item : p.itemDark}"/>`,
      );
    }
    return `${out.join("")}
      <circle cx="400" cy="300" r="70" fill="${p.item}"/>
      <path d="M386 356 L414 356 L410 470 L390 470 Z" fill="${p.accent}"/>`;
  },

  bottle: (p) => `
    <path d="M352 232 L448 232 L448 190 q 0 -14 -14 -14 L366 176 q -14 0 -14 14 Z" fill="${p.itemDark}"/>
    <rect x="366" y="152" width="68" height="34" rx="10" fill="${p.accent}"/>
    <path d="M344 236 L456 236 q 26 0 26 30 L482 452 q 0 30 -30 30 L348 482 q -30 0 -30 -30 L318 266 q 0 -30 26 -30 Z" fill="${p.item}"/>
    <rect x="346" y="300" width="108" height="96" rx="10" stroke="none" fill="#fff" opacity="0.85"/>
    <path d="M362 328 L438 328 M362 352 L420 352" stroke="${p.itemDark}" stroke-width="9" stroke-linecap="round"/>
    <path d="M332 268 q 10 120 12 200" stroke="#fff" stroke-width="12" opacity="0.4" fill="none" stroke-linecap="round"/>`,

  // Curd sets in a clay pot, which is what it is sold in and what people
  // recognise. As a straight-sided jar it read as a tin.
  pot: (p) => `
    <path d="M300 306 q 100 -30 200 0 q 34 62 30 106 q -6 96 -130 96 q -124 0 -130 -96 q -4 -44 30 -106 Z" fill="${p.accent}"/>
    <path d="M330 356 q 70 -20 140 0 q 22 44 18 74 q -4 68 -88 68 q -84 0 -88 -68 q -4 -30 18 -74 Z" fill="${p.accent}" opacity="0.5" stroke="none"/>
    <path d="M286 296 q 114 -36 228 0 q 6 22 -114 22 q -120 0 -114 -22 Z" fill="${p.accent}"/>
    <ellipse cx="400" cy="296" rx="96" ry="24" fill="${p.item}"/>
    <ellipse cx="400" cy="292" rx="78" ry="18" fill="${p.itemLight}" stroke="none"/>
    <path d="M470 214 q 30 6 26 42 q -4 34 -34 44" stroke="${p.itemDark}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <ellipse cx="466" cy="206" rx="30" ry="20" fill="${p.itemLight}" transform="rotate(-18 466 206)"/>`,

  jar: (p) => `
    <rect x="330" y="176" width="140" height="34" rx="12" fill="${p.accent}"/>
    <path d="M322 214 L478 214 q 22 0 22 26 L500 452 q 0 30 -30 30 L330 482 q -30 0 -30 -30 L300 240 q 0 -26 22 -26 Z" fill="${p.item}"/>
    <path d="M312 330 q 92 -30 176 0 L488 452 q 0 30 -30 30 L342 482 q -30 0 -30 -30 Z" fill="${p.itemDark}" opacity="0.55"/>
    <rect x="344" y="288" width="112" height="76" rx="10" stroke="none" fill="#fff" opacity="0.88"/>
    <path d="M362 314 L438 314 M362 338 L416 338" stroke="${p.itemDark}" stroke-width="9" stroke-linecap="round"/>`,

  // Gable-top milk carton, seen slightly from the side. The earlier flat slab
  // with a white panel read as a smartphone.
  carton: (p) => `
    <path d="M318 286 L400 240 L400 300 L318 346 Z" fill="${p.itemLight}"/>
    <path d="M482 286 L400 240 L400 300 L482 346 Z" fill="${p.itemDark}"/>
    <path d="M318 286 L400 300 L482 286 L482 470 q 0 18 -18 18 L336 488 q -18 0 -18 -18 Z" fill="${p.item}"/>
    <path d="M400 300 L482 286 L482 470 q 0 18 -18 18 L400 488 Z" fill="${p.itemDark}" opacity="0.35"/>
    <path d="M386 232 L414 232 L414 250 L386 250 Z" fill="${p.accent}"/>
    <path d="M318 286 L400 300 L482 286" stroke="${p.itemDark}" stroke-width="7" fill="none" opacity="0.7"/>
    <ellipse cx="400" cy="392" rx="46" ry="46" fill="#ffffff" opacity="0.92"/>
    <path d="M372 396 q 14 -34 28 -34 q 14 0 28 34 q -14 16 -28 16 q -14 0 -28 -16 Z" fill="${p.accent}"/>
    <circle cx="366" cy="356" r="9" fill="${p.accent}" opacity="0.8"/>`,

  sack: (p) => `
    <path d="M320 268 q 80 -34 160 0 q 26 92 18 178 q -6 42 -98 42 q -92 0 -98 -42 q -8 -86 18 -178 Z" fill="${p.item}"/>
    <path d="M320 268 q 80 -34 160 0 q -34 26 -80 26 q -46 0 -80 -26 Z" fill="${p.itemDark}"/>
    <rect x="348" y="336" width="104" height="82" rx="10" stroke="none" fill="#fff" opacity="0.86"/>
    <path d="M366 364 L434 364 M366 390 L414 390" stroke="${p.itemDark}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="336" cy="452" r="13" fill="${p.accent}"/>
    <circle cx="466" cy="446" r="10" fill="${p.accent}"/>`,

  bowl: (p, seed) => {
    const out: string[] = [];
    for (let i = 0; i < 22; i++) {
      const x = 316 + ((i * 43 + seed * 13) % 168);
      const y = 296 + ((i * 29 + seed * 7) % 46);
      out.push(
        `<ellipse cx="${x}" cy="${y}" rx="13" ry="9" fill="${i % 3 === 0 ? p.itemLight : p.item}" transform="rotate(${(i * 31) % 90} ${x} ${y})"/>`,
      );
    }
    return `${out.join("")}
      <path d="M286 336 L514 336 q -12 118 -114 118 q -102 0 -114 -118 Z" fill="${p.itemDark}"/>
      <path d="M286 336 L514 336 q -4 30 -12 42 L298 378 q -8 -12 -12 -42 Z" fill="${p.accent}" opacity="0.45"/>`;
  },

  eggs: (p) =>
    [
      { x: 336, y: 372 },
      { x: 400, y: 340 },
      { x: 464, y: 372 },
    ]
      .map(
        (e, i) => `<g>
      <ellipse cx="${e.x}" cy="${e.y}" rx="52" ry="66" fill="${i === 1 ? p.item : p.itemDark}"/>
      <ellipse cx="${e.x - 16}" cy="${e.y - 22}" rx="16" ry="20" stroke="none" fill="#fff" opacity="0.34"/>
    </g>`,
      )
      .join("") +
    `<path d="M270 402 L530 402 q -14 78 -130 78 q -116 0 -130 -78 Z" fill="${p.accent}"/>`,

  // A wrapped butter block on a dish with a cut pat and a curl. As two stacked
  // isometric cubes it read as a cardboard carton.
  blocks: (p) => `
    <path d="M296 356 L470 356 L470 436 q 0 14 -16 14 L312 450 q -16 0 -16 -14 Z" fill="${p.item}"/>
    <path d="M296 356 L340 318 L514 318 L470 356 Z" fill="${p.itemLight}"/>
    <path d="M470 356 L514 318 L514 398 q 0 14 -16 14 L470 436 Z" fill="${p.itemDark}"/>
    <path d="M340 318 L340 450 M384 318 L384 450" stroke="${p.itemDark}" stroke-width="5" opacity="0.35" fill="none"/>
    <path d="M296 356 L296 300 q 26 -14 44 -6 L340 318 Z" fill="${p.accent}" opacity="0.85"/>
    <path d="M470 436 L514 398" stroke="${p.itemDark}" stroke-width="5" opacity="0.35" fill="none"/>
    <path d="M330 288 q 30 -34 62 -12 q -18 8 -24 24 q -20 -10 -38 -12 Z" fill="${p.itemLight}"/>
    <path d="M262 462 q 138 -26 276 0 q -18 34 -138 34 q -120 0 -138 -34 Z" fill="${p.accent}" opacity="0.55"/>`,

  crystals: (p, seed) => {
    const out: string[] = [];
    for (let i = 0; i < 9; i++) {
      const x = 300 + ((i * 61 + seed * 19) % 200);
      const y = 320 + ((i * 47 + seed * 11) % 120);
      const s = 26 + ((i * 17) % 22);
      out.push(
        `<path d="M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z" fill="${i % 3 === 0 ? p.itemDark : p.item}"/>
         <path d="M${x} ${y - s} L${x + s} ${y} L${x} ${y} Z" stroke="none" fill="#fff" opacity="0.28"/>`,
      );
    }
    return out.join("");
  },

  beans: (p, seed) => {
    const out: string[] = [];
    for (let i = 0; i < 16; i++) {
      const x = 300 + ((i * 59 + seed * 23) % 210);
      const y = 300 + ((i * 41 + seed * 13) % 150);
      const rot = (i * 37 + seed * 5) % 180;
      out.push(
        `<g transform="rotate(${rot} ${x} ${y})">
          <ellipse cx="${x}" cy="${y}" rx="30" ry="21" fill="${i % 3 === 0 ? p.itemDark : p.item}"/>
          <path d="M${x - 22} ${y} q 22 -12 44 0 q -22 12 -44 0 Z" fill="${p.itemLight}" opacity="0.85"/>
        </g>`,
      );
    }
    return out.join("");
  },

  mango: (p) =>
    [
      { x: 322, y: 356, s: 1, rot: -14 },
      { x: 470, y: 336, s: 1.12, rot: 10 },
      { x: 396, y: 452, s: 0.9, rot: -4 },
    ]
      .map(
        (m, i) => `<g transform="translate(${m.x} ${m.y}) rotate(${m.rot}) scale(${m.s})">
      <path d="M0 -92 C 62 -92 96 -40 96 6 C 96 60 52 96 -4 96 C -62 96 -96 56 -96 4 C -96 -46 -56 -92 0 -92 Z"
            fill="${i === 1 ? p.item : p.itemDark}"/>
      <path d="M62 -66 q 30 26 32 66 q -26 -34 -46 -52 Z" fill="${p.itemLight}" opacity="0.75"/>
      <ellipse cx="-34" cy="-34" rx="22" ry="14" stroke="none" fill="#fff" opacity="0.26" transform="rotate(-24 -34 -34)"/>
      <path d="M4 -90 q 6 -26 34 -34 q -14 24 -18 36 Z" fill="${p.accent}"/>
    </g>`,
      )
      .join(""),

  halved: (p) => `
    <g>
      <ellipse cx="326" cy="352" rx="86" ry="112" fill="${p.itemDark}"/>
      <ellipse cx="326" cy="352" rx="62" ry="88" fill="${p.itemLight}"/>
      <circle cx="326" cy="368" r="34" fill="${p.accent}"/>
    </g>
    <g>
      <ellipse cx="486" cy="372" rx="82" ry="106" fill="${p.item}"/>
      <path d="M486 266 q 12 -30 -4 -46 q 26 10 26 46 Z" fill="${p.accent}"/>
      <ellipse cx="462" cy="330" rx="20" ry="28" stroke="none" fill="#fff" opacity="0.24"/>
    </g>`,
};

type Spec = { motif: keyof typeof motifs; palette: Palette };

// Each motif is drawn at its own natural size and vertical centre. A card crops
// this canvas to roughly a square, so everything is scaled down and re-centred
// on (400, 300) or the tall items (bottles, sacks, cartons) lose their tops.
const frame: Record<keyof typeof motifs, { scale: number; cy: number }> = {
  leafy: { scale: 0.82, cy: 320 },
  roundFruit: { scale: 0.9, cy: 372 },
  berries: { scale: 0.95, cy: 374 },
  bunch: { scale: 0.84, cy: 352 },
  curved: { scale: 0.78, cy: 356 },
  root: { scale: 0.76, cy: 360 },
  floret: { scale: 0.88, cy: 348 },
  bottle: { scale: 0.74, cy: 318 },
  jar: { scale: 0.78, cy: 330 },
  pot: { scale: 0.8, cy: 340 },
  carton: { scale: 0.82, cy: 344 },
  sack: { scale: 0.84, cy: 360 },
  bowl: { scale: 1, cy: 370 },
  eggs: { scale: 0.95, cy: 378 },
  blocks: { scale: 0.92, cy: 366 },
  crystals: { scale: 1, cy: 390 },
  beans: { scale: 1, cy: 376 },
  mango: { scale: 0.86, cy: 386 },
  halved: { scale: 0.9, cy: 360 },
};

const P = (
  bg: [string, string],
  item: string,
  itemDark: string,
  itemLight: string,
  accent: string,
): Palette => ({ bg, item, itemDark, itemLight, accent });

const products: Record<string, Spec> = {
  "organic-baby-spinach": { motif: "leafy", palette: P(["#eef6ee", "#dcecdd"], "#4f9e5c", "#37784a", "#8fca92", "#2a5136") },
  "heirloom-tomatoes": { motif: "roundFruit", palette: P(["#fdeeea", "#f8ddd6"], "#d9452f", "#b02f20", "#f07a63", "#4f9e5c") },
  "rainbow-carrots": { motif: "root", palette: P(["#fdf1e3", "#f9e2c7"], "#e5822c", "#c0631a", "#f4ad63", "#4f9e5c") },
  "broccoli-crowns": { motif: "floret", palette: P(["#ecf5ee", "#d8ebdc"], "#3f8a52", "#2c6a3d", "#6fb47e", "#96c47f") },
  "snake-gourd": { motif: "curved", palette: P(["#eff7ec", "#dceedb"], "#7cb455", "#5c9139", "#a8d187", "#3f8a52") },
  "little-millet": { motif: "sack", palette: P(["#f8f2e4", "#efe4cd"], "#d8b96a", "#b7964a", "#ecd9a4", "#8a6a3a") },
  "black-urad-whole": { motif: "bowl", palette: P(["#f0eff4", "#e0dee8"], "#3c3a4d", "#26243a", "#5d5a72", "#b0a68c") },
  "country-okra": { motif: "curved", palette: P(["#eef7ea", "#dbeed3"], "#69a83f", "#4d8429", "#9bc97a", "#3f8a52") },
  "curry-leaf-bunch": { motif: "leafy", palette: P(["#ebf4ec", "#d6e9d9"], "#2f7a44", "#1f5c31", "#63a874", "#8fca92") },
  "purple-brinjal": { motif: "curved", palette: P(["#f3eef7", "#e6dcf0"], "#6b3f9e", "#4d2a78", "#9873c4", "#4f9e5c") },
  "alphonso-mangoes": { motif: "mango", palette: P(["#fdeec5", "#f8d894"], "#f2a922", "#cf7c14", "#ffd36e", "#4f9e5c") },
  "wild-blueberries": { motif: "berries", palette: P(["#eef0f9", "#dcdff2"], "#4a5bb0", "#32407f", "#8894d6", "#3f8a52") },
  "hass-avocados": { motif: "halved", palette: P(["#eef5ea", "#dbead2"], "#4a7a3a", "#33582a", "#b9d98d", "#8a5a2b") },
  "banana-robusta": { motif: "curved", palette: P(["#fdf6df", "#f8ecbb"], "#f0c53a", "#cfa019", "#ffdf7a", "#7cb455") },
  "nendran-banana": { motif: "curved", palette: P(["#fbf7e6", "#f2ebc9"], "#d9bb46", "#b1932a", "#ecd97e", "#69a83f") },
  "panneer-grapes": { motif: "bunch", palette: P(["#f2f0f8", "#e4e0f0"], "#8a76bd", "#63509a", "#b6a7dc", "#4f9e5c") },
  "sweet-lime": { motif: "roundFruit", palette: P(["#f7f8e4", "#eef1c8"], "#c9cf3d", "#a3a924", "#e2e77c", "#4f9e5c") },
  "guava-allahabad-safeda": { motif: "halved", palette: P(["#f0f6ea", "#dfecd3"], "#a8c163", "#84a041", "#f3e0c4", "#d9758a") },
  "a2-whole-milk": { motif: "carton", palette: P(["#d7e4f6", "#b9cdeb"], "#ffffff", "#c4d5ec", "#ffffff", "#2f5fae") },
  "free-range-eggs": { motif: "eggs", palette: P(["#f7e4c2", "#eed3a4"], "#fff5e2", "#e3caa0", "#fffaf0", "#b9762c") },
  "cultured-farm-butter": { motif: "blocks", palette: P(["#f8e6b6", "#f0d489"], "#ffeda5", "#d8b452", "#fff6cf", "#a8701f") },
  "set-curd": { motif: "pot", palette: P(["#dfe8f3", "#c6d5e7"], "#ffffff", "#b7c7dc", "#ffffff", "#b06a3c") },
  "bilona-cow-ghee": { motif: "jar", palette: P(["#fdf3dc", "#f9e6b3"], "#efb63c", "#cb8f1c", "#ffd98a", "#8a6a3a") },
  "sonamasuri-brown-rice": { motif: "sack", palette: P(["#f7f2e8", "#ece2ce"], "#c9a878", "#a4844f", "#e6cfa9", "#4f9e5c") },
  "whole-red-lentils": { motif: "bowl", palette: P(["#fdefe7", "#f8dcce"], "#e0703c", "#bb4f21", "#f4a173", "#3c3a4d") },
  "stone-milled-wheat-flour": { motif: "sack", palette: P(["#f3e9d7", "#e6d5b8"], "#e0c79c", "#b99b6d", "#f3e6cd", "#7a5b2e") },
  "cold-pressed-coconut-oil": { motif: "bottle", palette: P(["#d5e9e3", "#b4d5cc"], "#f7fcfa", "#a2c4ba", "#ffffff", "#3f7a34") },
  "raw-forest-honey": { motif: "jar", palette: P(["#fdf1d9", "#f8e0aa"], "#e09a20", "#b6760c", "#f7c25c", "#8a6a3a") },
  "himalayan-rock-salt": { motif: "crystals", palette: P(["#f7dfe2", "#eec6cb"], "#e58c96", "#c26670", "#f7bfc5", "#8a5a2b") },
  "wood-pressed-groundnut-oil": { motif: "bottle", palette: P(["#fdf6e6", "#f8ebc8"], "#f0cd6a", "#cba33f", "#ffe6a3", "#8a6a3a") },
  "palm-jaggery-blocks": { motif: "blocks", palette: P(["#f6ede4", "#eaddcd"], "#8a5a2b", "#653c17", "#b3814d", "#d8b96a") },
  "single-origin-filter-coffee": { motif: "beans", palette: P(["#f4ece6", "#e6d8cd"], "#6b4227", "#4a2b16", "#9a6b46", "#c98b3a") },
  "raw-turmeric-fingers": { motif: "root", palette: P(["#fdf3d9", "#f8e5ab"], "#e8a220", "#c07d0c", "#f6c95e", "#4f9e5c") },
};

// Farms get a landscape rather than an object, so a directory card never looks
// like a product card.
// Each farm gets its own terrain and its own crop. Six tinted copies of the same
// hills defeat the point of a directory of six different places.
type Farm = {
  sky: [string, string];
  near: string;
  mid: string;
  far: string;
  sun: string;
  feature: "tea" | "paddy" | "coffee" | "banana" | "cattle" | "mango" | "peaks";
};

const farmPalettes: Record<string, Farm> = {
  "sundar-organics": { sky: ["#dfeff0", "#f3f7ea"], near: "#3f8a52", mid: "#5da368", far: "#8fbf8d", sun: "#f0c53a", feature: "tea" },
  "kaveri-farms": { sky: ["#fdf0d8", "#f8f4e2"], near: "#9aad38", mid: "#c1c957", far: "#dcd88e", sun: "#ef9a2b", feature: "paddy" },
  "coorg-highlands": { sky: ["#e4f0ea", "#f2f8f0"], near: "#2f6b45", mid: "#478059", far: "#83ac8c", sun: "#f6d97a", feature: "coffee" },
  "new-valley-produce": { sky: ["#fdf3e2", "#f9f7ec"], near: "#b98f2c", mid: "#d6b04e", far: "#e9d38c", sun: "#f0a52b", feature: "banana" },
  "bhavani-riverside": { sky: ["#e6f1f6", "#f4f8f4"], near: "#3f8560", mid: "#62a077", far: "#9fc4a4", sun: "#f2c14e", feature: "cattle" },
  "konkan-alphonso": { sky: ["#fdeedd", "#fdf6e6"], near: "#bd6f26", mid: "#dc9f48", far: "#eec488", sun: "#f4a93c", feature: "mango" },
  "kullu-hill-orchard": { sky: ["#e8eef8", "#f5f7fb"], near: "#3a5176", mid: "#647d9f", far: "#a2b3c9", sun: "#f6e2a8", feature: "peaks" },
};

function productSvg(slug: string, spec: Spec): string {
  const seed = [...slug].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const p = spec.palette;
  const f = frame[spec.motif];
  // Deep enough that the light plate reads as a spotlight rather than a smudge.
  const bg0 = deepen(p.itemDark, 0.05);
  const bg1 = deepen(p.itemDark, 0.115);
  // The subject was drawn at roughly 45% of the tile, which is why it vanished
  // in a 164x103 card slot. It now fills the plate.
  const scale = round(f.scale * 1.28);
  const ink = darken(p.itemDark, 0.45);
  // The soft floor shadow only makes sense under a motif that stands on the
  // ground; on a hanging bunch it reads as a detached grey ellipse.
  const grounded = spec.motif !== "bunch" && spec.motif !== "berries";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${bg0}"/>
      <stop offset="1" stop-color="${bg1}"/>
    </linearGradient>
  </defs>
${backdrop(p, seed, grounded)}
<g transform="translate(400 250) scale(${scale}) translate(-400 -${f.cy})"
   stroke="${ink}" stroke-width="${round(9 / scale)}" stroke-linejoin="round" stroke-linecap="round">
${motifs[spec.motif](p, seed)}
</g>
</svg>`;
}

function farmFeature(c: Farm, ink: string): string {
  const s = `stroke="${ink}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;

  switch (c.feature) {
    case "tea":
      return [0, 1, 2, 3]
        .map(
          (i) =>
            `<path d="M${40 + i * 200} 452 q 100 -38 200 -6" fill="none" stroke="${c.near}" stroke-width="26"/>
             <path d="M${40 + i * 200} 452 q 100 -38 200 -6" fill="none" stroke="${ink}" stroke-width="5" opacity="0.45"/>`,
        )
        .join("");

    case "paddy":
      return `<path d="M0 404 q 200 -28 400 -4 q 200 24 400 -12 L800 444 q -200 36 -400 12 q -200 -24 -400 4 Z" fill="#cfe3ee" ${s}/>
        ${[0, 1, 2, 3, 4, 5]
          .map(
            (i) =>
              `<path d="M${80 + i * 120} 436 L${80 + i * 120} 396" stroke="${ink}" stroke-width="5" opacity="0.5"/>`,
          )
          .join("")}`;

    case "coffee":
      return [150, 330, 510, 680]
        .map(
          (x, i) =>
            `<g><path d="M${x} 452 L${x} 392" ${s}/>
             <circle cx="${x}" cy="${368 - (i % 2) * 12}" r="${36 - (i % 2) * 5}" fill="${c.mid}" ${s}/>
             <circle cx="${x - 24}" cy="392" r="8" fill="#b8443a" stroke="none"/>
             <circle cx="${x + 22}" cy="384" r="7" fill="#b8443a" stroke="none"/></g>`,
        )
        .join("");

    case "banana":
      return [190, 400, 610]
        .map(
          (x) =>
            `<g><path d="M${x} 456 L${x} 372" ${s}/>
             <path d="M${x} 376 q -68 -28 -92 -80 q 64 6 92 58 Z" fill="${c.mid}" ${s}/>
             <path d="M${x} 376 q 68 -28 92 -80 q -64 6 -92 58 Z" fill="${c.near}" ${s}/></g>`,
        )
        .join("");

    case "cattle":
      // Zebu side view: shoulder hump, long face, ear, horn, tail. Earlier
      // attempts put the head above the body, where it read as a leaf.
      return [
        { x: 96, y: 228, k: 1 },
        { x: 452, y: 272, k: 0.72 },
      ]
        .map(
          ({ x, y, k }) => `<g transform="translate(${x} ${y}) scale(${k})">
            <path d="M70 132 L70 196 M110 138 L110 196 M190 138 L190 196 M228 132 L228 196" fill="none" ${s}/>
            <path d="M40 90 q 0 -40 45 -42 L200 44 q 45 2 45 46 L245 118 q 0 26 -30 26 L70 144 q -30 0 -30 -26 Z" fill="#f7f2e7" ${s}/>
            <path d="M162 48 q 36 -34 72 -2 q -36 10 -72 2 Z" fill="#f7f2e7" ${s}/>
            <path d="M244 70 q 30 -16 58 -6 q 28 10 28 36 q 0 26 -30 32 q -32 6 -56 -14 Z" fill="#f7f2e7" ${s}/>
            <ellipse cx="322" cy="110" rx="15" ry="13" fill="#e3d8c4" ${s}/>
            <path d="M250 72 q -24 -18 -38 -4 q 12 18 34 16 Z" fill="#e3d8c4" ${s}/>
            <path d="M288 58 q 8 -24 28 -28 q -4 22 -16 32 Z" fill="#e3d8c4" ${s}/>
            <circle cx="294" cy="92" r="6" fill="${ink}" stroke="none"/>
            <path d="M40 96 q -26 28 -18 70" fill="none" ${s}/>
            <circle cx="24" cy="172" r="11" fill="#e3d8c4" ${s}/>
            <path d="M84 104 q 34 -14 58 6 q -28 22 -58 10 Z" fill="#cfc3ab" stroke="none"/>
          </g>`,
        )
        .join("");

    case "mango":
      return [200, 420, 630]
        .map(
          (x, i) =>
            `<g><path d="M${x} 456 L${x} 384" ${s}/>
             <circle cx="${x}" cy="${350 - i * 8}" r="${54 - i * 5}" fill="${c.mid}" ${s}/>
             <ellipse cx="${x - 20}" cy="${372 - i * 6}" rx="12" ry="16" fill="#f0a52b" ${s}/>
             <ellipse cx="${x + 22}" cy="${362 - i * 6}" rx="11" ry="15" fill="#e8901c" ${s}/></g>`,
        )
        .join("");

    case "peaks":
      return `<path d="M50 400 L160 246 L270 400 Z" fill="#eef3fa" ${s}/>
        <path d="M290 410 L430 212 L570 410 Z" fill="#f7fafd" ${s}/>
        <path d="M560 400 L660 264 L760 400 Z" fill="#eef3fa" ${s}/>
        <path d="M130 296 L160 246 L190 296 L166 284 L148 296 Z" fill="#ffffff" stroke="none"/>
        <path d="M392 270 L430 212 L470 270 L442 256 L418 270 Z" fill="#ffffff" stroke="none"/>`;
  }
}

function farmSvg(slug: string): string {
  const c = farmPalettes[slug];
  const ink = darken(c.near, 0.45);
  // The sun sits low and is overdrawn by the hills. Up in the sky it collided
  // with the card's corner badges; behind the ridge it never can.
  const seed = [...slug].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const sunX = 180 + ((seed * 7) % 440);
  const cloud = (x: number, y: number, k: number) =>
    `<g transform="translate(${x} ${y}) scale(${k})" fill="#ffffff" opacity="0.55">
      <circle cx="0" cy="0" r="26"/><circle cx="34" cy="-12" r="34"/><circle cx="74" cy="2" r="24"/>
      <rect x="-2" y="-4" width="78" height="28" rx="14"/>
    </g>`;
  // The scene is lifted in the frame because these files are shown at 16:5 on a
  // farm page and 8:5 on a card; a centre crop of the original composition cut
  // the herd in half.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.sky[0]}"/>
      <stop offset="1" stop-color="${c.sky[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${cloud(90 + (seed % 60), 130, 1)}
  ${cloud(520 - (seed % 80), 92, 0.72)}
  <circle cx="${sunX}" cy="230" r="58" fill="${c.sun}" opacity="0.95"/>
  <g transform="translate(0 -66)">
    <path d="M0 296 q 150 -62 300 -16 q 150 46 300 -22 q 120 -54 200 -12 L800 500 L0 500 Z" fill="${c.far}"/>
    <path d="M0 352 q 190 -56 380 -6 q 190 50 420 -18 L800 500 L0 500 Z" fill="${c.mid}"/>
    ${farmFeature(c, ink)}
    <path d="M0 452 q 220 -34 430 4 q 210 38 370 -12 L800 500 L0 500 Z" fill="${c.near}"/>
  </g>
  <rect y="430" width="${W}" height="70" fill="${c.near}"/>
</svg>`;
}

const dir = "public/products";
mkdirSync(dir, { recursive: true });
mkdirSync("public/farms", { recursive: true });

for (const file of readdirSync(dir)) unlinkSync(`${dir}/${file}`);

for (const [slug, spec] of Object.entries(products)) {
  writeFileSync(`${dir}/${slug}.svg`, productSvg(slug, spec));
}
for (const slug of Object.keys(farmPalettes)) {
  writeFileSync(`public/farms/${slug}.svg`, farmSvg(slug));
}

console.log(
  `wrote ${Object.keys(products).length} product illustrations and ${Object.keys(farmPalettes).length} farm scenes`,
);
