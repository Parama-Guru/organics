import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductForm } from "@/app/pannai/product-form";
import { FARMER_PORTAL, getFarmer } from "@/lib/farmer-auth";
import { prisma } from "@/lib/prisma";
import { listRegions } from "@/lib/regions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  const [categories, regions] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, nameTa: true },
      orderBy: { name: "asc" },
    }),
    listRegions(),
  ]);

  return (
    <div>
      <Link href={FARMER_PORTAL} className="inline-flex min-h-11 items-center text-sm text-bark-600">
        ← பொருட்கள்
      </Link>
      <h1 className="mt-2 font-display text-3xl text-bark-900">புதிய பொருள்</h1>
      <ProductForm categories={categories} regions={regions} />
    </div>
  );
}
