/**
 * Removes demonstration data and, optionally, buyer accounts.
 *
 * Nothing is deleted without an explicit flag, because both of these are
 * irreversible against a shared cloud database.
 *
 *   npm run data:purge -- --customers          buyer accounts and their data
 *   npm run data:purge -- --samples            seeded farms, shops and listings
 *   npm run data:purge -- --customers --samples
 *
 * Add --dry-run to print what would go without touching anything.
 */
import "dotenv/config";

import { loadConfig } from "../conf/config";

// tsx runs this directly, so prisma.config.ts never loads.
const postgres = loadConfig().database.postgres;
process.env.DATABASE_URL ||= postgres.url;
process.env.DIRECT_URL ||= postgres.direct_url || postgres.url;

const { prisma } = await import("../src/lib/prisma");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const purgeCustomers = args.has("--customers");
const purgeSamples = args.has("--samples");

async function reportCustomers() {
  const [customers, identities, saved, savedFarms, enquiries, subs, attempts] = await Promise.all([
    prisma.customer.count(),
    prisma.customerIdentity.count(),
    prisma.savedProduct.count(),
    prisma.savedFarmer.count(),
    prisma.privateEnquiry.count(),
    prisma.customerSubscription.count(),
    prisma.subscriptionAttempt.count(),
  ]);
  console.log(
    `customers=${customers} identities=${identities} savedProducts=${saved} ` +
      `savedFarmers=${savedFarms} enquiries=${enquiries} subscriptions=${subs} attempts=${attempts}`,
  );
  return customers;
}

async function reportSamples() {
  const [farmers, products, stores] = await Promise.all([
    prisma.farmer.count({ where: { isSample: true } }),
    prisma.product.count({ where: { isSample: true } }),
    prisma.organicStore.count({ where: { isSample: true } }),
  ]);
  console.log(`sample farmers=${farmers} products=${products} stores=${stores}`);
  return farmers + products + stores;
}

async function main() {
  if (!purgeCustomers && !purgeSamples) {
    console.log("Nothing selected. Pass --customers and/or --samples, optionally with --dry-run.\n");
    console.log("Current state:");
    await reportCustomers();
    await reportSamples();
    return;
  }

  if (purgeCustomers) {
    console.log("Buyer data before:");
    await reportCustomers();

    if (!dryRun) {
      // Explicit order rather than relying on cascade rules, so a schema change
      // that drops a cascade cannot silently leave orphans behind.
      await prisma.$transaction([
        prisma.savedProduct.deleteMany({}),
        prisma.savedFarmer.deleteMany({}),
        prisma.privateEnquiry.deleteMany({}),
        prisma.subscriptionAttempt.deleteMany({}),
        prisma.paymentEvent.deleteMany({}),
        prisma.customerSubscription.deleteMany({}),
        prisma.customerIdentity.deleteMany({}),
        prisma.customer.deleteMany({}),
      ]);
      console.log("Buyer data after:");
      await reportCustomers();
    }
  }

  if (purgeSamples) {
    console.log("Sample data before:");
    await reportSamples();

    if (!dryRun) {
      const sampleFarmers = await prisma.farmer.findMany({
        where: { isSample: true },
        select: { id: true },
      });
      const sampleStores = await prisma.organicStore.findMany({
        where: { isSample: true },
        select: { id: true },
      });
      const farmerIds = sampleFarmers.map((f) => f.id);
      const storeIds = sampleStores.map((s) => s.id);
      const sampleProducts = await prisma.product.findMany({
        where: { isSample: true },
        select: { id: true },
      });
      const productIds = sampleProducts.map((p) => p.id);

      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.savedProduct.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.savedFarmer.deleteMany({ where: { farmerId: { in: farmerIds } } }),
        prisma.privateEnquiry.deleteMany({
          where: { OR: [{ farmerId: { in: farmerIds } }, { storeId: { in: storeIds } }] },
        }),
        prisma.sponsoredMetric.deleteMany({
          where: {
            placement: { OR: [{ farmerId: { in: farmerIds } }, { storeId: { in: storeIds } }] },
          },
        }),
        prisma.sponsoredPlacement.deleteMany({
          where: { OR: [{ farmerId: { in: farmerIds } }, { storeId: { in: storeIds } }] },
        }),
        prisma.sellerReviewEvent.deleteMany({
          where: { OR: [{ farmerId: { in: farmerIds } }, { storeId: { in: storeIds } }] },
        }),
        prisma.product.deleteMany({ where: { isSample: true } }),
        prisma.organicStore.deleteMany({ where: { isSample: true } }),
        prisma.farmer.deleteMany({ where: { isSample: true } }),
      ]);
      console.log("Sample data after:");
      await reportSamples();
    }
  }

  if (dryRun) console.log("\n--dry-run: nothing was deleted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
