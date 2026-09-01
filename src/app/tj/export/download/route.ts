import { NextResponse, type NextRequest } from "next/server";

import { isSignedIn } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Rows fetched, converted and flushed per turn. */
const BATCH = 500;

/**
 * Escape one CSV cell.
 *
 * The quoting is the easy half. The leading apostrophe is the important half:
 * Excel, LibreOffice and Sheets all treat a cell that begins `=`, `+`, `-`, `@`
 * or a control character as a formula, so a farm that names itself
 * `=HYPERLINK("http://evil","click")` — or, worse, one of the DDE payloads that
 * shell out — would execute on the machine of whoever opens the export. These
 * are exactly the fields the public can write into, so every cell is neutered
 * before it is written.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  // The whole C0 range, not just tab and carriage return: they are never
  // meaningful at the start of a name or an address, and which of them a given
  // spreadsheet build skips over before finding a formula is not worth tracking.
  if (/^[\u0000-\u001F=+\-@]/.test(text)) text = `'${text}`;

  // Quote unconditionally rather than only when a delimiter is present: it is
  // valid CSV either way, and one rule is harder to get wrong than two.
  return `"${text.replace(/"/g, '""')}"`;
}

const line = (values: unknown[]) => `${values.map(cell).join(",")}\r\n`;

type Page = { rows: unknown[][]; cursor: string | null };

type CsvExport = {
  headers: string[];
  /** One batch, newest first, resuming after `cursor`. */
  page: (cursor: string | null) => Promise<Page>;
};

/**
 * `id` is the tiebreaker on every ordering so the cursor is deterministic: two
 * rows sharing a `createdAt` could otherwise repeat or be skipped between
 * batches.
 */
const ORDER = [{ createdAt: "desc" as const }, { id: "desc" as const }];

const slice = (cursor: string | null) => ({
  take: BATCH,
  orderBy: ORDER,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
});

function pageOf<T extends { id: string }>(rows: T[], toRow: (row: T) => unknown[]): Page {
  return {
    rows: rows.map(toRow),
    // A short batch means the table is exhausted. A full one costs at most one
    // extra empty round trip, which is cheaper than guessing wrong.
    cursor: rows.length === BATCH ? (rows[rows.length - 1]?.id ?? null) : null,
  };
}

const EXPORTS: Record<string, CsvExport> = {
  customers: {
    headers: [
      "id",
      "name",
      "email",
      "phone",
      "district",
      "status",
      "language",
      "registered_at",
      "last_seen_at",
      "saved_listings",
      "saved_farms",
    ],
    page: async (cursor) =>
      pageOf(
        await prisma.customer.findMany({
          ...slice(cursor),
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            locale: true,
            createdAt: true,
            lastSeenAt: true,
            region: { select: { name: true } },
            _count: { select: { savedProducts: true, savedFarmers: true } },
          },
        }),
        (r) => [
          r.id,
          r.name,
          r.email,
          r.phone,
          r.region?.name,
          r.status,
          r.locale,
          r.createdAt,
          r.lastSeenAt,
          r._count.savedProducts,
          r._count.savedFarmers,
        ],
      ),
  },

  farmers: {
    headers: [
      "id",
      "slug",
      "farm_name",
      "contact_name",
      "email",
      "phone",
      "district",
      "status",
      "about",
      "aadhaar_last4",
      "certifier",
      "certificate_no",
      "certificate_url",
      "certified_until",
      "verified_at",
      "review_note",
      "portal_enabled_at",
      "last_sign_in_at",
      "registered_at",
      "listings",
    ],
    page: async (cursor) =>
      pageOf(
        await prisma.farmer.findMany({
          ...slice(cursor),
          select: {
            id: true,
            slug: true,
            farmName: true,
            contactName: true,
            email: true,
            phone: true,
            status: true,
            about: true,
            govtIdLast4: true,
            certifier: true,
            certificateNo: true,
            certificateUrl: true,
            certifiedUntil: true,
            verifiedAt: true,
            reviewNote: true,
            portalEnabledAt: true,
            lastSignInAt: true,
            createdAt: true,
            region: { select: { name: true } },
            _count: { select: { products: true } },
          },
        }),
        (r) => [
          r.id,
          r.slug,
          r.farmName,
          r.contactName,
          r.email,
          r.phone,
          r.region.name,
          r.status,
          r.about,
          r.govtIdLast4,
          r.certifier,
          r.certificateNo,
          r.certificateUrl,
          r.certifiedUntil,
          r.verifiedAt,
          r.reviewNote,
          r.portalEnabledAt,
          r.lastSignInAt,
          r.createdAt,
          r._count.products,
        ],
      ),
  },

  stores: {
    headers: [
      "id",
      "slug",
      "store_name",
      "contact_name",
      "email",
      "phone",
      "address",
      "district",
      "status",
      "about",
      "aadhaar_last4",
      "fssai_number",
      "certifier",
      "certificate_no",
      "certificate_url",
      "certified_until",
      "verified_at",
      "review_note",
      "registered_at",
    ],
    page: async (cursor) =>
      pageOf(
        await prisma.organicStore.findMany({
          ...slice(cursor),
          select: {
            id: true,
            slug: true,
            storeName: true,
            contactName: true,
            email: true,
            phone: true,
            addressLine: true,
            status: true,
            about: true,
            govtIdLast4: true,
            fssaiNumber: true,
            certifier: true,
            certificateNo: true,
            certificateUrl: true,
            certifiedUntil: true,
            verifiedAt: true,
            reviewNote: true,
            createdAt: true,
            region: { select: { name: true } },
          },
        }),
        (r) => [
          r.id,
          r.slug,
          r.storeName,
          r.contactName,
          r.email,
          r.phone,
          r.addressLine,
          r.region.name,
          r.status,
          r.about,
          r.govtIdLast4,
          r.fssaiNumber,
          r.certifier,
          r.certificateNo,
          r.certificateUrl,
          r.certifiedUntil,
          r.verifiedAt,
          r.reviewNote,
          r.createdAt,
        ],
      ),
  },

  messages: {
    headers: ["id", "sender_type", "name", "email", "phone", "message", "sent_at", "answered_at"],
    page: async (cursor) =>
      pageOf(await prisma.contactMessage.findMany(slice(cursor)), (r) => [
        r.id,
        r.role,
        r.name,
        r.email,
        r.phone,
        r.message,
        r.createdAt,
        r.handledAt,
      ]),
  },
};

export async function GET(request: NextRequest) {
  // Every one of these files is a list of names, emails and phone numbers.
  // The session check is the only thing between it and the open internet.
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "";
  const chosen = Object.hasOwn(EXPORTS, type) ? EXPORTS[type] : undefined;
  if (!chosen) {
    return NextResponse.json(
      { error: `Unknown export. Use one of: ${Object.keys(EXPORTS).join(", ")}.` },
      { status: 400 },
    );
  }

  // Streamed in batches rather than one findMany. These tables are unbounded
  // and the instance has 512 MB, so building the whole file in memory is an
  // export that works right up until the day it takes the site down. Capping
  // the row count instead would be worse: an export that silently leaves people
  // out is not an export.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      // A UTF-8 BOM: without it Excel on Windows reads the Tamil columns as
      // mojibake, which makes the export useless for half the data in it.
      controller.enqueue(encoder.encode(`\uFEFF${line(chosen.headers)}`));

      let cursor: string | null = null;
      try {
        do {
          const batch: Page = await chosen.page(cursor);
          if (batch.rows.length > 0) {
            controller.enqueue(encoder.encode(batch.rows.map(line).join("")));
          }
          cursor = batch.cursor;
        } while (cursor);
        controller.close();
      } catch (error) {
        // The status line left with the first chunk, so this can no longer be a
        // 500. Erroring the stream is what stops the browser keeping a truncated
        // file as though it were the whole thing.
        controller.error(error);
      }
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="organics-${type}-${stamp}.csv"`,
      // Personal data: never let a proxy or the browser keep a copy.
      "Cache-Control": "no-store, private",
    },
  });
}
