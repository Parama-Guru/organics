import Link from "next/link";
import { redirect } from "next/navigation";

import { DecisionButtons } from "@/app/admin/decision-buttons";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TONE = {
  PENDING: "marigold",
  VERIFIED: "leaf",
  REJECTED: "neutral",
  SUSPENDED: "neutral",
} as const;

function FarmerRow({
  farmer,
  actions,
}: {
  farmer: {
    id: string;
    slug: string;
    farmName: string;
    contactName: string;
    email: string;
    phone: string;
    region: string;
    about: string | null;
    govtIdLast4: string | null;
    certificateUrl: string | null;
    status: keyof typeof TONE;
    createdAt: Date;
    _count: { products: number };
  };
  actions: { status: "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING"; label: string; variant?: "primary" | "secondary" | "dark" }[];
}) {
  return (
    <li className="rounded-2xl border border-bark-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-bark-900">{farmer.farmName}</h3>
          <p className="text-sm text-bark-600">
            {farmer.contactName} · {farmer.region}
          </p>
        </div>
        <Badge tone={TONE[farmer.status]}>{farmer.status}</Badge>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-bark-600">Phone</dt>
          <dd className="font-medium">
            <a href={`tel:${farmer.phone.replace(/\s/g, "")}`} className="hover:underline">
              {farmer.phone}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Email</dt>
          <dd className="min-w-0 truncate font-medium">{farmer.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Aadhaar last 4</dt>
          <dd className="font-mono font-medium">{farmer.govtIdLast4 ?? "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Applied</dt>
          <dd className="font-medium">{farmer.createdAt.toISOString().slice(0, 10)}</dd>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <dt className="text-bark-600">Certificate</dt>
          <dd className="min-w-0 truncate font-medium">
            {farmer.certificateUrl ? (
              // Untrusted, applicant-supplied URL: never let it reach window.opener.
              <a
                href={farmer.certificateUrl}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="hover:underline"
              >
                {farmer.certificateUrl}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      {farmer.about ? <p className="mt-3 text-sm text-bark-600">{farmer.about}</p> : null}

      {farmer.status === "VERIFIED" ? (
        <p className="mt-3 text-sm text-bark-600">
          {farmer._count.products} listing{farmer._count.products === 1 ? "" : "s"} ·{" "}
          <Link href={`/ta/farmers/${farmer.slug}`} className="font-medium hover:underline">
            View public page
          </Link>
        </p>
      ) : null}

      <DecisionButtons farmerId={farmer.id} actions={actions} />
    </li>
  );
}

export default async function AdminHome() {
  if (!(await isSignedIn())) redirect("/admin/login");

  const select = {
    id: true,
    slug: true,
    farmName: true,
    contactName: true,
    email: true,
    phone: true,
    region: true,
    about: true,
    govtIdLast4: true,
    certificateUrl: true,
    status: true,
    createdAt: true,
    _count: { select: { products: true } },
  } as const;

  const [pending, verified, closed] = await Promise.all([
    prisma.farmer.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select,
    }),
    prisma.farmer.findMany({
      where: { status: "VERIFIED" },
      orderBy: { farmName: "asc" },
      select,
    }),
    prisma.farmer.findMany({
      where: { status: { in: ["REJECTED", "SUSPENDED"] } },
      orderBy: { updatedAt: "desc" },
      select,
    }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-bark-900">Farm applications</h1>
          <p className="mt-1 text-sm text-bark-600">
            Nothing a farm submits is public until it is approved here.
          </p>
        </div>
        <Link
          href="/admin/farmers/new"
          className="text-sm font-medium text-bark-900 underline-offset-4 hover:underline"
        >
          Add a farm directly
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg text-bark-900">
          Waiting for review{" "}
          <span className="text-bark-600">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-sm text-bark-600">
            No applications waiting.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pending.map((farmer) => (
              <FarmerRow
                key={farmer.id}
                farmer={farmer}
                actions={[
                  { status: "VERIFIED", label: "Approve", variant: "primary" },
                  { status: "REJECTED", label: "Reject" },
                ]}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-bark-900">
          Live on the site <span className="text-bark-600">({verified.length})</span>
        </h2>
        {verified.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-sm text-bark-600">
            No verified farms yet.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {verified.map((farmer) => (
              <FarmerRow
                key={farmer.id}
                farmer={farmer}
                actions={[{ status: "SUSPENDED", label: "Suspend" }]}
              />
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg text-bark-900">
            Rejected and suspended <span className="text-bark-600">({closed.length})</span>
          </h2>
          <ul className="mt-3 grid gap-3">
            {closed.map((farmer) => (
              <FarmerRow
                key={farmer.id}
                farmer={farmer}
                actions={[
                  { status: "VERIFIED", label: "Approve", variant: "primary" },
                  { status: "PENDING", label: "Move back to review" },
                ]}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
