import { redirect } from "next/navigation";

import { isSignedIn } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminExportPage() {
  if (!(await isSignedIn())) redirect("/tj/login");

  const [
    customers,
    customersActive,
    farmers,
    farmersVerified,
    stores,
    storesVerified,
    messages,
    messagesUnanswered,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.farmer.count(),
    prisma.farmer.count({ where: { status: "VERIFIED" } }),
    prisma.organicStore.count(),
    prisma.organicStore.count({ where: { status: "VERIFIED" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { handledAt: null } }),
  ]);

  const sets = [
    {
      type: "customers",
      title: "Buyers",
      total: customers,
      live: `${customersActive} active`,
      detail:
        "Name, email, phone, district, language, when they registered, when last seen, and how much they have saved.",
    },
    {
      type: "farmers",
      title: "Farmers",
      total: farmers,
      live: `${farmersVerified} listed`,
      detail:
        "Everything on the application — farm, contact, phone, email, district, certification, review note — plus portal access and listing count.",
    },
    {
      type: "stores",
      title: "Organic stores",
      total: stores,
      live: `${storesVerified} listed`,
      detail:
        "Shop, contact, phone, email, full address, district, FSSAI licence, certification and review note.",
    },
    {
      type: "messages",
      title: "Contact messages",
      total: messages,
      live: `${messagesUnanswered} unanswered`,
      detail: "Who wrote in, which of the three they said they were, and what they wrote.",
    },
  ];

  return (
    <>
      <h1 className="font-display text-2xl text-bark-900">Export</h1>
      <p className="mt-1 max-w-3xl text-sm text-bark-600">
        Every registration, with all the details, as a spreadsheet. Files are UTF-8 CSV with a byte
        order mark, so Excel on Windows opens the Tamil columns correctly rather than as mojibake.
      </p>

      {/* Saying this once, here, is worth more than a policy nobody reads: the
          person clicking has just been handed every phone number on the site. */}
      <p className="mt-4 max-w-3xl rounded-2xl border border-marigold-200 bg-marigold-50 p-4 text-sm leading-relaxed text-bark-900">
        These files contain personal data — names, phone numbers, email addresses and the last four
        digits of Aadhaar numbers. Keep them off shared drives and delete your copy when you are
        done with it.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {sets.map((set) => (
          <li
            key={set.type}
            className="flex flex-col rounded-2xl border border-bark-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg text-bark-900">{set.title}</h2>
              <p className="text-sm text-bark-600">
                <span className="font-display text-2xl text-bark-900">{set.total}</span> registered
                · {set.live}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bark-600">{set.detail}</p>
            {/* A plain link, not a fetch: the browser's own download handling is
                better than anything worth writing here, and it keeps the page a
                server component. */}
            <a
              href={`/tj/export/download?type=${set.type}`}
              download
              className="mt-5 inline-flex min-h-11 w-fit items-center rounded-xl bg-bark-900 px-5 text-sm font-medium text-white"
            >
              Download CSV
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
