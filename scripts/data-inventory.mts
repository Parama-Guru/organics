/**
 * Prints a row count for every table, and flags anything still marked as sample
 * data. Run with: npm run data:inventory
 */
import "dotenv/config";

import { loadConfig } from "../conf/config";

// tsx runs this directly, so prisma.config.ts never loads.
const postgres = loadConfig().database.postgres;
process.env.DATABASE_URL ||= postgres.url;
process.env.DIRECT_URL ||= postgres.direct_url || postgres.url;

const { prisma } = await import("../src/lib/prisma");

async function main() {
  const [
    categories,
    regions,
    farmers,
    sampleFarmers,
    products,
    sampleProducts,
    productImages,
    stores,
    sampleStores,
    contactMessages,
    customers,
    customerIdentities,
    savedProducts,
    savedFarmers,
    privateEnquiries,
    sponsoredPlacements,
    sponsoredMetrics,
    sellerReviewEvents,
    subscriptions,
    subscriptionAttempts,
    paymentEvents,
  ] = await Promise.all([
    prisma.category.count(),
    prisma.region.count(),
    prisma.farmer.count(),
    prisma.farmer.count({ where: { isSample: true } }),
    prisma.product.count(),
    prisma.product.count({ where: { isSample: true } }),
    prisma.productImage.count(),
    prisma.organicStore.count(),
    prisma.organicStore.count({ where: { isSample: true } }),
    prisma.contactMessage.count(),
    prisma.customer.count(),
    prisma.customerIdentity.count(),
    prisma.savedProduct.count(),
    prisma.savedFarmer.count(),
    prisma.privateEnquiry.count(),
    prisma.sponsoredPlacement.count(),
    prisma.sponsoredMetric.count(),
    prisma.sellerReviewEvent.count(),
    prisma.customerSubscription.count(),
    prisma.subscriptionAttempt.count(),
    prisma.paymentEvent.count(),
  ]);

  const rows = [
    ["Category", categories, ""],
    ["Region", regions, ""],
    ["Farmer", farmers, `${sampleFarmers} sample`],
    ["Product", products, `${sampleProducts} sample`],
    ["ProductImage", productImages, ""],
    ["OrganicStore", stores, `${sampleStores} sample`],
    ["ContactMessage", contactMessages, ""],
    ["Customer", customers, ""],
    ["CustomerIdentity", customerIdentities, ""],
    ["SavedProduct", savedProducts, ""],
    ["SavedFarmer", savedFarmers, ""],
    ["PrivateEnquiry", privateEnquiries, ""],
    ["SponsoredPlacement", sponsoredPlacements, ""],
    ["SponsoredMetric", sponsoredMetrics, ""],
    ["SellerReviewEvent", sellerReviewEvents, ""],
    ["CustomerSubscription", subscriptions, ""],
    ["SubscriptionAttempt", subscriptionAttempts, ""],
    ["PaymentEvent", paymentEvents, ""],
  ] as const;

  const width = Math.max(...rows.map(([name]) => name.length));
  console.log("table".padEnd(width), "rows".padStart(6), " note");
  console.log("-".repeat(width + 8 + 14));
  for (const [name, count, note] of rows) {
    console.log(name.padEnd(width), String(count).padStart(6), " " + note);
  }

  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  console.log("-".repeat(width + 8 + 14));
  console.log("total".padEnd(width), String(total).padStart(6));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
