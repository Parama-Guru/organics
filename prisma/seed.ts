import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import { loadConfig } from "../conf/config";

// tsx runs this file directly, so prisma.config.ts never loads. Resolve the
// datasource the same way the app does, before the client reads it.
const postgres = loadConfig().database.postgres;
process.env.DATABASE_URL ||= postgres.url;
process.env.DIRECT_URL ||= postgres.direct_url || postgres.url;

const prisma = new PrismaClient();

// Placeholder art until real photos are uploaded to Supabase Storage. Served
// from /public so no remote image host has to be allowed.
const SHOTS = [
  "/products/crate.svg",
  "/products/closeup.svg",
  "/products/field.svg",
  "/products/pack.svg",
];

// Deterministic per-slug rotation: every product gets a stable, distinct set.
function shotsFor(slug: string): string[] {
  const start = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % SHOTS.length;
  return [0, 1, 2].map((offset) => SHOTS[(start + offset) % SHOTS.length]);
}

type SeedFarmer = {
  slug: string;
  contactName: string;
  farmName: string;
  phone: string;
  email: string;
  region: string;
  about: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  govtIdLast4?: string;
};

const farmers: SeedFarmer[] = [
  {
    slug: "sundar-organics",
    contactName: "Sundar Ramasamy",
    farmName: "Sundar Organics",
    phone: "+91 98430 11234",
    email: "sundar@sundarorganics.in",
    region: "Nilgiris",
    about:
      "Third-generation hill farm above Coonoor. Certified organic since 2016, growing leaf vegetables and tomatoes without synthetic inputs.",
    status: "VERIFIED",
    govtIdLast4: "4417",
  },
  {
    slug: "kaveri-farms",
    contactName: "Kaveri Devi",
    farmName: "Kaveri Delta Farms",
    phone: "+91 90031 55820",
    email: "kaveri@kaverideltafarms.in",
    region: "Thanjavur",
    about:
      "Delta paddy and pulses co-operative of eleven families. Unpolished rice milled to order, never fumigated in storage.",
    status: "VERIFIED",
    govtIdLast4: "9082",
  },
  {
    slug: "coorg-highlands",
    contactName: "Anil Bopanna",
    farmName: "Coorg Highland Estate",
    phone: "+91 97417 60455",
    email: "anil@coorghighland.in",
    region: "Coorg",
    about:
      "Shade-grown estate in Madikeri. Avocado, coffee and cold-pressed coconut oil, all wood-pressed on the estate.",
    status: "VERIFIED",
    govtIdLast4: "2310",
  },
  {
    // Listings stay hidden until an admin verifies this account.
    slug: "new-valley-produce",
    contactName: "Meera Nair",
    farmName: "New Valley Produce",
    phone: "+91 99529 74100",
    email: "meera@newvalleyproduce.in",
    region: "Erode",
    about: "Recently applied. Turmeric and banana smallholding on the Bhavani river.",
    status: "PENDING",
    govtIdLast4: "7765",
  },
];

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  unit: string;
  emoji: string;
  region: string;
  stock: number;
  isFeatured?: boolean;
  // Omitted means the shop stocks it itself, like Amazon's first-party retail.
  farmerSlug?: string;
};

const catalog: Array<{
  name: string;
  slug: string;
  description: string;
  products: SeedProduct[];
}> = [
  {
    name: "Fresh Vegetables",
    slug: "fresh-vegetables",
    description: "Crisp, seasonal vegetables harvested from certified organic farms.",
    products: [
      {
        name: "Organic Baby Spinach",
        slug: "organic-baby-spinach",
        description:
          "Tender baby spinach leaves, triple-washed and ready to cook or toss into a salad.",
        priceCents: 4900,
        unit: "250 g bag",
        emoji: "\u{1F96C}",
        region: "Nilgiris",
        stock: 120,
        isFeatured: true,
        farmerSlug: "sundar-organics",
      },
      {
        name: "Heirloom Tomatoes",
        slug: "heirloom-tomatoes",
        description:
          "Vine-ripened heirloom tomatoes with a deep, sweet flavour. Grown without synthetic pesticides.",
        priceCents: 8900,
        unit: "500 g",
        emoji: "\u{1F345}",
        region: "Nilgiris",
        stock: 80,
        isFeatured: true,
        farmerSlug: "sundar-organics",
      },
      {
        name: "Rainbow Carrots",
        slug: "rainbow-carrots",
        description: "A colourful bunch of purple, yellow and orange carrots, harvested young.",
        priceCents: 7900,
        unit: "bunch",
        emoji: "\u{1F955}",
        region: "Nilgiris",
        stock: 95,
        farmerSlug: "sundar-organics",
      },
      {
        name: "Broccoli Crowns",
        slug: "broccoli-crowns",
        description: "Dense, dark-green crowns picked at peak freshness and chilled within hours.",
        priceCents: 6900,
        unit: "each",
        emoji: "\u{1F966}",
        region: "Coorg",
        stock: 60,
      },
      {
        name: "Snake Gourd",
        slug: "snake-gourd",
        description: "Tender pudalangai picked young, before the seeds harden. Classic poriyal material.",
        priceCents: 4400,
        unit: "500 g",
        emoji: "\u{1F952}",
        region: "Thanjavur",
        stock: 70,
        farmerSlug: "kaveri-farms",
      },      {
        name: "Little Millet",
        slug: "little-millet",
        description: "Samai from a rainfed plot, hulled but unpolished. Cooks like a short-grain rice.",
        priceCents: 21900,
        unit: "2 kg",
        emoji: "\u{1F33E}",
        region: "Thanjavur",
        stock: 44,
        farmerSlug: "kaveri-farms",
      },
      {
        name: "Black Urad Whole",
        slug: "black-urad-whole",
        description: "Skin-on urad for a properly dark, tempered dal. Sorted by hand, never polished.",
        priceCents: 19900,
        unit: "1 kg",
        emoji: "\u{1FAD8}",
        region: "Thanjavur",
        stock: 58,
        farmerSlug: "kaveri-farms",
      },      {
        name: "Country Okra",
        slug: "country-okra",
        description: "Short, ridged native bhindi that stays firm in the pan instead of turning slimy.",
        priceCents: 5400,
        unit: "500 g",
        emoji: "\u{1FAD1}",
        region: "Thanjavur",
        stock: 88,
        farmerSlug: "kaveri-farms",
      },
      {
        name: "Curry Leaf Bunch",
        slug: "curry-leaf-bunch",
        description: "Thick, glossy karuveppilai cut the morning it ships. Never sprayed.",
        priceCents: 2500,
        unit: "100 g bunch",
        emoji: "\u{1F33F}",
        region: "Nilgiris",
        stock: 140,
        farmerSlug: "sundar-organics",
      },
      {
        name: "Purple Brinjal",
        slug: "purple-brinjal",
        description: "Small, seedy-sweet kathirikai that holds its shape through a long simmer.",
        priceCents: 4900,
        unit: "500 g",
        emoji: "\u{1F346}",
        region: "Erode",
        stock: 75,
      },
    ],
  },
  {
    name: "Fresh Fruits",
    slug: "fresh-fruits",
    description: "Naturally ripened fruit with nothing sprayed on and nothing waxed over.",
    products: [
      {
        name: "Alphonso Mangoes",
        slug: "alphonso-mangoes",
        description: "Sun-ripened Alphonso mangoes, carbide-free and hand-picked at the orchard.",
        priceCents: 89900,
        unit: "box of 6",
        emoji: "\u{1F96D}",
        region: "Ratnagiri",
        stock: 40,
        isFeatured: true,
      },
      {
        name: "Wild Blueberries",
        slug: "wild-blueberries",
        description: "Small, intense wild blueberries packed with antioxidants.",
        priceCents: 39900,
        unit: "150 g punnet",
        emoji: "\u{1FAD0}",
        region: "Himachal",
        stock: 55,
      },
      {
        name: "Hass Avocados",
        slug: "hass-avocados",
        description: "Creamy Hass avocados shipped at the perfect stage of ripeness.",
        priceCents: 34900,
        unit: "pack of 3",
        emoji: "\u{1F951}",
        region: "Coorg",
        stock: 70,
        farmerSlug: "coorg-highlands",
      },
      {
        name: "Banana Robusta",
        slug: "banana-robusta",
        description: "Everyday organic bananas, ripened naturally without ethylene treatment.",
        priceCents: 5900,
        unit: "1 kg",
        emoji: "\u{1F34C}",
        region: "Thanjavur",
        stock: 150,
      },
      {
        name: "Nendran Banana",
        slug: "nendran-banana",
        description: "Firm Kerala nendran, the right variety for chips or a steamed breakfast.",
        priceCents: 8900,
        unit: "1 kg",
        emoji: "\u{1F34C}",
        region: "Erode",
        stock: 60,
        farmerSlug: "new-valley-produce",
      },
      {
        name: "Panneer Grapes",
        slug: "panneer-grapes",
        description: "Seeded Cumbum valley grapes with a musky finish. Sold loose, never waxed.",
        priceCents: 14900,
        unit: "500 g",
        emoji: "\u{1F347}",
        region: "Nilgiris",
        stock: 52,
        farmerSlug: "sundar-organics",
      },
      {
        name: "Sweet Lime",
        slug: "sweet-lime",
        description: "Thin-skinned mosambi that juices cleanly without turning bitter.",
        priceCents: 9900,
        unit: "1 kg",
        emoji: "\u{1F34A}",
        region: "Erode",
        stock: 96,
      },
      {
        name: "Guava, Allahabad Safeda",
        slug: "guava-allahabad-safeda",
        description: "Crisp white-fleshed guava picked at the snap stage, not the soft stage.",
        priceCents: 7900,
        unit: "1 kg",
        emoji: "\u{1F7E2}",
        region: "Coorg",
        stock: 64,
        farmerSlug: "coorg-highlands",
      },
    ],
  },
  {
    name: "Dairy & Eggs",
    slug: "dairy-and-eggs",
    description: "From pasture-raised herds and free-roaming flocks.",
    products: [
      {
        name: "A2 Whole Milk",
        slug: "a2-whole-milk",
        description: "Single-origin A2 milk from grass-fed cows, gently pasteurised.",
        priceCents: 9900,
        unit: "1 L",
        emoji: "\u{1F95B}",
        region: "Erode",
        stock: 100,
        isFeatured: true,
      },
      {
        name: "Free-Range Eggs",
        slug: "free-range-eggs",
        description: "Rich orange yolks from hens raised outdoors on an organic feed.",
        priceCents: 12900,
        unit: "dozen",
        emoji: "\u{1F95A}",
        region: "Erode",
        stock: 85,
      },
      {
        name: "Cultured Farm Butter",
        slug: "cultured-farm-butter",
        description: "Slow-cultured butter churned in small batches with just cream and salt.",
        priceCents: 27900,
        unit: "200 g",
        emoji: "\u{1F9C8}",
        region: "Erode",
        stock: 45,
      },
      {
        name: "Set Curd",
        slug: "set-curd",
        description: "Thick pot-set curd from the same A2 herd, cultured overnight and never stirred.",
        priceCents: 6900,
        unit: "400 g pot",
        emoji: "\u{1F368}",
        region: "Erode",
        stock: 70,
      },
      {
        name: "Bilona Cow Ghee",
        slug: "bilona-cow-ghee",
        description: "Hand-churned from cultured curd, not cream. Grainy, deep yellow, strongly aromatic.",
        priceCents: 89900,
        unit: "500 ml",
        emoji: "\u{1F36F}",
        region: "Erode",
        stock: 30,
        isFeatured: true,
      },
    ],
  },
  {
    name: "Grains & Pulses",
    slug: "grains-and-pulses",
    description: "Stone-milled grains and single-origin pulses, stored without fumigation.",
    products: [
      {
        name: "Sonamasuri Brown Rice",
        slug: "sonamasuri-brown-rice",
        description: "Unpolished Sonamasuri rice with a soft bite and a low glycaemic index.",
        priceCents: 54900,
        unit: "5 kg",
        emoji: "\u{1F35A}",
        region: "Thanjavur",
        stock: 35,
        farmerSlug: "kaveri-farms",
      },
      {
        name: "Whole Red Lentils",
        slug: "whole-red-lentils",
        description: "Chemical-free red lentils that cook down fast into a silky dal.",
        priceCents: 17900,
        unit: "1 kg",
        emoji: "\u{1FAD8}",
        region: "Thanjavur",
        stock: 65,
        farmerSlug: "kaveri-farms",
      },
      {
        name: "Stone-Milled Wheat Flour",
        slug: "stone-milled-wheat-flour",
        description: "Chakki-milled whole wheat flour with the bran and germ left intact.",
        priceCents: 31900,
        unit: "5 kg",
        emoji: "\u{1F33E}",
        region: "Thanjavur",
        stock: 50,
      },
    ],
  },
  {
    name: "Pantry Staples",
    slug: "pantry-staples",
    description: "Cold-pressed oils, raw honey and everyday essentials without additives.",
    products: [
      {
        name: "Cold-Pressed Coconut Oil",
        slug: "cold-pressed-coconut-oil",
        description: "Wood-pressed virgin coconut oil with its natural aroma preserved.",
        priceCents: 39900,
        unit: "500 ml",
        emoji: "\u{1F965}",
        region: "Coorg",
        stock: 48,
        farmerSlug: "coorg-highlands",
      },
      {
        name: "Raw Forest Honey",
        slug: "raw-forest-honey",
        description: "Unheated, unfiltered multi-floral honey collected from forest hives.",
        priceCents: 54900,
        unit: "500 g",
        emoji: "\u{1F36F}",
        region: "Nilgiris",
        stock: 42,
        isFeatured: true,
      },
      {
        name: "Himalayan Rock Salt",
        slug: "himalayan-rock-salt",
        description: "Hand-mined pink rock salt, unrefined and free of anti-caking agents.",
        priceCents: 8900,
        unit: "1 kg",
        emoji: "\u{1F9C2}",
        region: "Himachal",
        stock: 90,
      },
      {
        name: "Wood-Pressed Groundnut Oil",
        slug: "wood-pressed-groundnut-oil",
        description: "Chekku oil pressed slowly so it keeps its colour and its smell. Unrefined.",
        priceCents: 44900,
        unit: "1 L",
        emoji: "\u{1F95C}",
        region: "Coorg",
        stock: 40,
        farmerSlug: "coorg-highlands",
      },
      {
        name: "Palm Jaggery Blocks",
        slug: "palm-jaggery-blocks",
        description: "Karupatti tapped from palmyra, boiled down with nothing added. Smoky and dark.",
        priceCents: 24900,
        unit: "500 g",
        emoji: "\u{1F36B}",
        region: "Thanjavur",
        stock: 62,
        farmerSlug: "kaveri-farms",
      },
      {
        name: "Single-Origin Filter Coffee",
        slug: "single-origin-filter-coffee",
        description: "Shade-grown arabica with 20% chicory, roasted dark and ground for a steel filter.",
        priceCents: 39900,
        unit: "500 g",
        emoji: "\u{2615}",
        region: "Coorg",
        stock: 55,
        isFeatured: true,
        farmerSlug: "coorg-highlands",
      },
      {
        name: "Raw Turmeric Fingers",
        slug: "raw-turmeric-fingers",
        description: "High-curcumin Erode turmeric, sun-dried whole so you can grind it yourself.",
        priceCents: 17900,
        unit: "500 g",
        emoji: "\u{1F7E1}",
        region: "Erode",
        stock: 48,
        farmerSlug: "new-valley-produce",
      },
    ],
  },
];

async function main() {
  const farmerIdBySlug = new Map<string, string>();

  for (const farmer of farmers) {
    const { status, ...rest } = farmer;
    const data = {
      ...rest,
      status,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
    };
    const saved = await prisma.farmer.upsert({
      where: { slug: farmer.slug },
      update: data,
      create: data,
    });
    farmerIdBySlug.set(farmer.slug, saved.id);
  }

  for (const category of catalog) {
    const { products, ...categoryData } = category;

    const savedCategory = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: categoryData,
      create: categoryData,
    });

    for (const product of products) {
      const { farmerSlug, ...productData } = product;
      const shots = shotsFor(product.slug);
      const data = {
        ...productData,
        imageUrl: shots[0],
        categoryId: savedCategory.id,
        farmerId: farmerSlug ? (farmerIdBySlug.get(farmerSlug) ?? null) : null,
      };

      const saved = await prisma.product.upsert({
        where: { slug: product.slug },
        update: data,
        create: data,
      });

      // Replace rather than append so re-seeding does not stack duplicates.
      await prisma.productImage.deleteMany({ where: { productId: saved.id } });
      await prisma.productImage.createMany({
        data: shots.map((url, position) => ({
          productId: saved.id,
          url,
          position,
          alt: `${product.name} — view ${position + 1}`,
        })),
      });
    }
  }

  const [categories, products, farmerCount, verified, images] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.farmer.count(),
    prisma.farmer.count({ where: { status: "VERIFIED" } }),
    prisma.productImage.count(),
  ]);

  console.log(
    `Seed complete: ${categories} categories, ${products} products, ${images} images, ` +
      `${farmerCount} farmers (${verified} verified).`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
