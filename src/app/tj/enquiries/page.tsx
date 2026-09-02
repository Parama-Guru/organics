import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EnquiryHandledButton, RetryEnquiryButton } from "@/app/tj/store-buttons";
import { AdminSearch, Pager } from "@/app/tj/table-controls";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const FILTERS = ["unresolved", "failed", "stored", "sent", "resolved", "all"] as const;
type Filter = (typeof FILTERS)[number];

export default async function AdminEnquiriesPage({ searchParams }: PageProps<"/tj/enquiries">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const rawShow = Array.isArray(params.show) ? params.show[0] : params.show;
  const show: Filter = FILTERS.includes(rawShow as Filter) ? (rawShow as Filter) : "unresolved";
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);

  const stateWhere: Prisma.PrivateEnquiryWhereInput =
    show === "unresolved"
      ? { handledAt: null }
      : show === "resolved"
        ? { handledAt: { not: null } }
        : show === "failed"
          ? { handledAt: null, deliveryStatus: "FAILED" }
          : show === "stored"
            ? { handledAt: null, deliveryStatus: "PENDING" }
            : show === "sent"
              ? { deliveryStatus: "SENT" }
              : {};

  const where: Prisma.PrivateEnquiryWhereInput = {
    ...stateWhere,
    ...(query
      ? {
          OR: [
            { id: { equals: query } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
            { senderEmail: { contains: query, mode: "insensitive" } },
            { recipientName: { contains: query, mode: "insensitive" } },
            { recipientEmail: { contains: query, mode: "insensitive" } },
            { subject: { contains: query, mode: "insensitive" } },
            { message: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [enquiries, total, unresolved, failed] = await Promise.all([
    prisma.privateEnquiry.findMany({
      where,
      orderBy: [{ handledAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: { select: { name: true } } },
    }),
    prisma.privateEnquiry.count({ where }),
    prisma.privateEnquiry.count({ where: { handledAt: null } }),
    prisma.privateEnquiry.count({ where: { handledAt: null, deliveryStatus: "FAILED" } }),
  ]);

  return (
    <>
      <h1 className="font-display text-2xl text-bark-900">Buyer enquiries</h1>
      <p className="mt-1 text-sm text-bark-600">
        Stored before email is attempted. {unresolved} unresolved; {failed} failed delivery.
      </p>

      <nav aria-label="Filter enquiries" className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((value) => {
          const href = `/tj/enquiries?show=${value}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          return (
            <Link
              key={value}
              href={href}
              aria-current={show === value ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm capitalize ${
                show === value
                  ? "border-bark-900 bg-inverse text-white"
                  : "border-bark-200 bg-paper text-bark-600"
              }`}
            >
              {value}
            </Link>
          );
        })}
      </nav>

      <AdminSearch
        action="/tj/enquiries"
        query={query}
        placeholder="Buyer, seller, email, subject or message"
        hidden={{ show }}
      />

      {enquiries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-bark-200 bg-paper p-8 text-center text-sm text-bark-600">
          No enquiry matches this view.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id} className="rounded-2xl border border-bark-200 bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium break-words text-bark-900">{enquiry.subject}</h2>
                    <Badge
                      tone={
                        enquiry.deliveryStatus === "SENT"
                          ? "leaf"
                          : enquiry.deliveryStatus === "FAILED"
                            ? "marigold"
                            : "neutral"
                      }
                    >
                      {enquiry.deliveryStatus}
                    </Badge>
                    {enquiry.handledAt ? <Badge tone="neutral">RESOLVED</Badge> : null}
                    {enquiry.sellerReadAt ? <Badge tone="leaf">SELLER READ</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-bark-600">
                    {enquiry.customer.name} ({enquiry.senderEmail}) → {enquiry.recipientName} (
                    {enquiry.recipientEmail})
                  </p>
                  <p className="mt-1 text-xs text-bark-600">
                    Reference {enquiry.id} · {enquiry.createdAt.toISOString()} · {enquiry.shareEmail ? "reply email shared" : "reply email private"}
                    {enquiry.sentAt ? ` · sent ${enquiry.sentAt.toISOString()}` : ""}
                    {enquiry.sellerReadAt ? ` · opened ${enquiry.sellerReadAt.toISOString()}` : ""}
                  </p>
                </div>
                <EnquiryHandledButton
                  enquiryId={enquiry.id}
                  handled={enquiry.handledAt !== null}
                />
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-bark-900">
                {enquiry.message}
              </p>
              {enquiry.lastDeliveryError ? (
                <p className="mt-3 rounded-xl bg-red-50 p-3 font-mono text-xs text-red-700">
                  Delivery: {enquiry.lastDeliveryError} · attempts {enquiry.deliveryAttempts}
                </p>
              ) : null}
              {enquiry.deliveryStatus !== "SENT" ? (
                <div className="mt-3">
                  <RetryEnquiryButton enquiryId={enquiry.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Pager
        basePath="/tj/enquiries"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        extra={{ show, ...(query ? { q: query } : {}) }}
      />
    </>
  );
}
