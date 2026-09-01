import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { MessageHandledButton } from "@/app/tj/store-buttons";
import { AdminSearch, Pager } from "@/app/tj/table-controls";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { CONTACT_ROLES } from "@/lib/contact-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ROLE_LABEL: Record<(typeof CONTACT_ROLES)[number], string> = {
  CUSTOMER: "Buyer",
  FARMER: "Farmer",
  STORE: "Organic store",
  OTHER: "Other",
};

export default async function AdminMessagesPage({ searchParams }: PageProps<"/tj/messages">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const role = CONTACT_ROLES.find((value) => value === rawRole);
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);

  const where: Prisma.ContactMessageWhereInput = {
    ...(role ? { role } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { message: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  };

  const [messages, total, unanswered] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      // Unanswered first, oldest of those at the top: the person who has been
      // waiting longest is the one to deal with next.
      orderBy: [{ handledAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { handledAt: null } }),
  ]);

  const filters = [
    { label: "All", value: "" },
    { label: "Buyers", value: "CUSTOMER" },
    { label: "Farmers", value: "FARMER" },
    { label: "Stores", value: "STORE" },
    { label: "Other", value: "OTHER" },
  ];

  return (
    <>
      <h1 className="font-display text-2xl text-bark-900">Messages</h1>
      <p className="mt-1 text-sm text-bark-600">
        Everything sent through the contact form. Stored here rather than emailed, so nothing is
        lost when mail is not configured. {total} shown, {unanswered} still unanswered.
      </p>

      <nav aria-label="Filter by sender" className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = (role ?? "") === filter.value;
          const href = filter.value
            ? `/tj/messages?role=${filter.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`
            : `/tj/messages${query ? `?q=${encodeURIComponent(query)}` : ""}`;
          return (
            <a
              key={filter.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm ${
                active
                  ? "border-bark-900 bg-bark-900 text-white"
                  : "border-bark-200 bg-white text-bark-600"
              }`}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      <AdminSearch
        action="/tj/messages"
        query={query}
        placeholder="Name, email, phone or text"
        hidden={role ? { role } : {}}
      />

      {messages.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-sm text-bark-600">
          {query || role ? "No message matches that." : "Nobody has written in yet."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`rounded-2xl border p-4 ${
                message.handledAt ? "border-bark-200 bg-white" : "border-marigold-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium break-words text-bark-900">{message.name}</p>
                    <Badge tone={message.handledAt ? "neutral" : "marigold"}>
                      {ROLE_LABEL[message.role]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-bark-600">
                    <a
                      href={`mailto:${message.email}`}
                      className="break-all underline underline-offset-4"
                    >
                      {message.email}
                    </a>
                    {message.phone ? (
                      <>
                        {" · "}
                        <a
                          href={`tel:${message.phone.replace(/[^+0-9]/g, "")}`}
                          className="underline underline-offset-4"
                        >
                          {message.phone}
                        </a>
                      </>
                    ) : null}
                    {" · "}
                    {message.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    {message.handledAt
                      ? ` · answered ${message.handledAt.toISOString().slice(0, 10)}`
                      : ""}
                  </p>
                </div>
                <MessageHandledButton
                  messageId={message.id}
                  handled={message.handledAt !== null}
                />
              </div>

              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-bark-900">
                {message.message}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pager
        basePath="/tj/messages"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        extra={{ ...(query ? { q: query } : {}), ...(role ? { role } : {}) }}
      />
    </>
  );
}
