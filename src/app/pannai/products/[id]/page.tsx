import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProductForm } from "@/app/pannai/product-form";
import { FARMER_PORTAL, getFarmer } from "@/lib/farmer-auth";
import { getFarmerProduct } from "@/lib/farmer-products";
import { prisma } from "@/lib/prisma";
import { listRegions } from "@/lib/regions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: PageProps<"/pannai/products/[id]">) {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  const { id } = await params;
  // Scoped to the signed-in farm, so another farm's id simply does not exist here.
  const [product, categories, regions] = await Promise.all([
    getFarmerProduct(farmer.id, id),
    prisma.category.findMany({
      select: { id: true, name: true, nameTa: true },
      orderBy: { name: "asc" },
    }),
    listRegions(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <Link href={FARMER_PORTAL} className="inline-flex min-h-11 items-center text-sm text-bark-600">
        ← பொருட்கள்
      </Link>
      <h1 className="mt-2 font-display text-3xl break-words text-bark-900">
        {product.nameTa ?? product.name}
      </h1>
      <ProductForm categories={categories} regions={regions} existing={product} />
    </div>
  );
}
