import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteProductButton, ToggleActiveButton } from "@/app/pannai/row-buttons";
import { FARMER_PORTAL, getFarmer } from "@/lib/farmer-auth";
import { listFarmerProducts } from "@/lib/farmer-products";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  added: "பொருள் சேர்க்கப்பட்டது.",
  saved: "மாற்றங்கள் சேமிக்கப்பட்டன.",
  removed: "பொருள் நீக்கப்பட்டது.",
};

export default async function FarmerHomePage({ searchParams }: PageProps<"/pannai">) {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  const [params, products, unreadEnquiries] = await Promise.all([
    searchParams,
    listFarmerProducts(farmer.id),
    prisma.privateEnquiry.count({ where: { farmerId: farmer.id, sellerReadAt: null } }),
  ]);
  const notice = Object.keys(NOTICES).find((key) => params[key] === "1");

  const live = products.filter((product) => product.isActive).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">பண்ணை workspace</p>
          <h1 className="mt-5 font-display text-5xl font-medium leading-none text-bark-900 sm:text-6xl">{farmer.farmName}</h1>
          <p className="mt-4 text-bark-600">
            {products.length} பொருட்கள் · {live} கடையில் · {unreadEnquiries} படிக்காத விசாரணைகள்
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`${FARMER_PORTAL}/enquiries`}
            className="flex min-h-12 items-center rounded-full border border-bark-200 bg-white px-5 font-medium text-bark-900"
          >
            விசாரணைகள்
          </Link>
          <Link
            href={`${FARMER_PORTAL}/products/new`}
            className="flex min-h-12 items-center rounded-full bg-marigold-500 px-6 font-medium text-bark-900"
          >
            புதிது சேர்க்க
          </Link>
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className="mt-5 rounded-xl bg-leaf-50 p-3 text-leaf-800 ring-1 ring-inset ring-leaf-200"
        >
          {NOTICES[notice]}
        </p>
      ) : null}

      {products.length === 0 ? (
        <div className="editorial-panel mt-10 rounded-[2rem] border-dashed p-10 text-center">
          <p className="font-display text-xl text-bark-900">இன்னும் பொருள் எதுவும் இல்லை</p>
          <p className="mx-auto mt-2 max-w-sm text-bark-600">
            நீங்கள் விளைவிப்பதைச் சேர்த்தால் அது கடையில் தெரியும்.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4">
          {products.map((product) => (
            <li
              key={product.id}
              className="editorial-panel rounded-[1.5rem] p-5 sm:p-6"
            >
              {/* On a 360px phone the thumbnail, the name and the status badge
                  cannot share one line: the name column collapsed to 88px and
                  broke Tamil words mid-syllable. Below sm the badge drops to
                  its own row and the name gets the width. */}
              <div className="flex items-start gap-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-leaf-50">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg break-words text-bark-900">
                    {product.nameTa ?? product.name}
                  </p>
                  <p className="mt-0.5 text-sm text-bark-600">
                    {formatMoney(product.priceCents)} / {product.unit} ·{" "}
                    {product.category.nameTa ?? product.category.name}
                    {product._count.savedBy > 0
                      ? ` · ${product._count.savedBy} பேர் சேமித்துள்ளனர்`
                      : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${
                        product.isActive ? "bg-leaf-100 text-leaf-800" : "bg-bark-100 text-bark-600"
                      }`}
                    >
                      {product.isActive ? "கடையில்" : "மறைத்தது"}
                    </span>
                    {/* Live but with nothing left to sell reads as "not
                        available" on the public page, so it is said here too
                        rather than left for a buyer to discover. */}
                    {product.isActive && product.stock === 0 ? (
                      <span className="rounded-full bg-marigold-100 px-3 py-1 font-medium text-bark-900">
                        இருப்பு இல்லை
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`${FARMER_PORTAL}/products/${product.id}`}
                  className="flex min-h-11 items-center rounded-full border border-bark-200 px-4 text-sm font-medium text-bark-900"
                >
                  திருத்த
                </Link>
                <ToggleActiveButton id={product.id} isActive={product.isActive} />
                <DeleteProductButton id={product.id} name={product.nameTa ?? product.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
