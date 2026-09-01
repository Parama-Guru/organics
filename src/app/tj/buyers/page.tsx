import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { CustomerControls } from "@/app/tj/manage-buttons";
import { AdminSearch, Pager } from "@/app/tj/table-controls";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminBuyersPage({ searchParams }: PageProps<"/tj/buyers">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);

  const where: Prisma.CustomerWhereInput = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        locale: true,
        createdAt: true,
        lastSeenAt: true,
        region: { select: { name: true } },
        _count: { select: { savedProducts: true, savedFarmers: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return (
    <>
      <h1 className="font-display text-2xl text-bark-900">Buyers</h1>
      <p className="mt-1 text-sm text-bark-600">
        An account holds an email, a name and a shortlist — no address and no card, because the
        site takes no payment. {total} in total.
      </p>

      <AdminSearch action="/tj/buyers" query={query} placeholder="Name, email or phone" />

      {customers.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-sm text-bark-600">
          {query ? "Nobody matches that search." : "Nobody has signed up yet."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {customers.map((customer) => (
            <li
              key={customer.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-bark-200 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium break-words text-bark-900">{customer.name}</p>
                  {customer.status === "SUSPENDED" ? (
                    <Badge tone="neutral">SUSPENDED</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm break-all text-bark-600">{customer.email}</p>
                <p className="mt-1 text-sm text-bark-600">
                  {customer.region?.name ?? "No district"} · {customer.phone ?? "No phone"} ·
                  joined {customer.createdAt.toISOString().slice(0, 10)}
                  {customer.lastSeenAt
                    ? ` · last seen ${customer.lastSeenAt.toISOString().slice(0, 10)}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-bark-600">
                  {customer._count.savedProducts} saved listing
                  {customer._count.savedProducts === 1 ? "" : "s"} ·{" "}
                  {customer._count.savedFarmers} saved farm
                  {customer._count.savedFarmers === 1 ? "" : "s"}
                </p>
              </div>
              <CustomerControls
                customerId={customer.id}
                email={customer.email}
                status={customer.status}
              />
            </li>
          ))}
        </ul>
      )}

      <Pager
        basePath="/tj/buyers"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        extra={query ? { q: query } : {}}
      />
    </>
  );
}
