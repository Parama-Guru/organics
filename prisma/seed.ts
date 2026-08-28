import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  unit: string;
  emoji: string;
  stock: number;
  isFeatured?: boolean;
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
        priceCents: 349,
        unit: "250 g bag",
        emoji: "\u{1F96C}",
        stock: 120,
        isFeatured: true,
      },
      {
        name: "Heirloom Tomatoes",
        slug: "heirloom-tomatoes",
        description:
          "Vine-ripened heirloom tomatoes with a deep, sweet flavour. Grown without synthetic pesticides.",
        priceCents: 599,
        unit: "500 g",
        emoji: "\u{1F345}",
        stock: 80,
        isFeatured: true,
      },
      {
        name: "Rainbow Carrots",
        slug: "rainbow-carrots",
        description: "A colourful bunch of purple, yellow and orange carrots, harvested young.",
        priceCents: 429,
        unit: "bunch",
        emoji: "\u{1F955}",
        stock: 95,
      },
      {
        name: "Broccoli Crowns",
        slug: "broccoli-crowns",
        description: "Dense, dark-green crowns picked at peak freshness and chilled within hours.",
        priceCents: 389,
        unit: "each",
        emoji: "\u{1F966}",
        stock: 60,
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
        priceCents: 1249,
        unit: "box of 6",
        emoji: "\u{1F96D}",
        stock: 40,
        isFeatured: true,
      },
      {
        name: "Wild Blueberries",
        slug: "wild-blueberries",
        description: "Small, intense wild blueberries packed with antioxidants.",
        priceCents: 749,
        unit: "150 g punnet",
        emoji: "\u{1FAD0}",
        stock: 55,
      },
      {
        name: "Hass Avocados",
        slug: "hass-avocados",
        description: "Creamy Hass avocados shipped at the perfect stage of ripeness.",
        priceCents: 899,
        unit: "pack of 3",
        emoji: "\u{1F951}",
        stock: 70,
      },
      {
        name: "Banana Robusta",
        slug: "banana-robusta",
        description: "Everyday organic bananas, ripened naturally without ethylene treatment.",
        priceCents: 249,
        unit: "1 kg",
        emoji: "\u{1F34C}",
        stock: 150,
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
        priceCents: 429,
        unit: "1 L",
        emoji: "\u{1F95B}",
        stock: 100,
        isFeatured: true,
      },
      {
        name: "Free-Range Eggs",
        slug: "free-range-eggs",
        description: "Rich orange yolks from hens raised outdoors on an organic feed.",
        priceCents: 649,
        unit: "dozen",
        emoji: "\u{1F95A}",
        stock: 85,
      },
      {
        name: "Cultured Farm Butter",
        slug: "cultured-farm-butter",
        description: "Slow-cultured butter churned in small batches with just cream and salt.",
        priceCents: 899,
        unit: "200 g",
        emoji: "\u{1F9C8}",
        stock: 45,
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
        priceCents: 1099,
        unit: "5 kg",
        emoji: "\u{1F35A}",
        stock: 35,
      },
      {
        name: "Whole Red Lentils",
        slug: "whole-red-lentils",
        description: "Chemical-free red lentils that cook down fast into a silky dal.",
        priceCents: 549,
        unit: "1 kg",
        emoji: "\u{1FAD8}",
        stock: 65,
      },
      {
        name: "Stone-Milled Wheat Flour",
        slug: "stone-milled-wheat-flour",
        description: "Chakki-milled whole wheat flour with the bran and germ left intact.",
        priceCents: 699,
        unit: "5 kg",
        emoji: "\u{1F33E}",
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
        priceCents: 979,
        unit: "500 ml",
        emoji: "\u{1F965}",
        stock: 48,
      },
      {
        name: "Raw Forest Honey",
        slug: "raw-forest-honey",
        description: "Unheated, unfiltered multi-floral honey collected from forest hives.",
        priceCents: 1199,
        unit: "500 g",
        emoji: "\u{1F36F}",
        stock: 42,
        isFeatured: true,
      },
      {
        name: "Himalayan Rock Salt",
        slug: "himalayan-rock-salt",
        description: "Hand-mined pink rock salt, unrefined and free of anti-caking agents.",
        priceCents: 329,
        unit: "1 kg",
        emoji: "\u{1F9C2}",
        stock: 90,
      },
    ],
  },
];

async function main() {
  for (const category of catalog) {
    const { products, ...categoryData } = category;

    const savedCategory = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: categoryData,
      create: categoryData,
    });

    for (const product of products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: { ...product, categoryId: savedCategory.id },
        create: { ...product, categoryId: savedCategory.id },
      });
    }
  }

  const [categories, products] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);

  console.log(`Seed complete: ${categories} categories, ${products} products.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
