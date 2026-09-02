import { z } from "zod";

import { endOfIndiaDate } from "./india-date";

// Shared by the form and the route so the two cannot drift.
export const storeApplicationSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[+0-9][0-9 ()-]{5,19}$/, "enter a reachable phone number"),
  region: z.string().trim().min(2).max(80),
  // Published on the shop's entry, because the point of listing a shop is that
  // someone can walk into it.
  addressLine: z.string().trim().min(6).max(240),
  about: z.string().trim().min(20).max(1000),
  // Last four digits only; the full ID is never collected or stored.
  govtIdLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "enter the last 4 digits"),
  // A shop cannot legally sell food in India without an FSSAI licence, so this
  // is required where a farm's organic certificate is the equivalent gate.
  // Fourteen digits, spaces allowed as they are printed on the licence.
  fssaiNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{14}$/, "an FSSAI licence number is 14 digits")),
  // Optional for a shop: a reseller need not hold a certificate itself, so long
  // as what it stocks is certified. Where one is given it is published.
  certifier: z.union([z.string().trim().min(3).max(160), z.literal("")]).optional(),
  certificateNo: z.union([z.string().trim().min(3).max(80), z.literal("")]).optional(),
  certifiedUntil: z
    .union([
      z.iso.date().refine((value) => {
        const expiry = endOfIndiaDate(value);
        return Boolean(expiry && expiry > new Date());
      }, "certificate expiry must be in the future"),
      z.literal(""),
    ])
    .optional(),
  certificateUrl: z.union([z.url().max(500), z.literal("")]).optional(),
}).superRefine((value, ctx) => {
  const anyCertificate = Boolean(
    value.certifier || value.certificateNo || value.certifiedUntil || value.certificateUrl,
  );
  if (!anyCertificate) return;

  if (!value.certifier) {
    ctx.addIssue({ code: "custom", path: ["certifier"], message: "required with a certificate" });
  }
  if (!value.certificateNo) {
    ctx.addIssue({ code: "custom", path: ["certificateNo"], message: "required with a certificate" });
  }
  if (!value.certifiedUntil) {
    ctx.addIssue({ code: "custom", path: ["certifiedUntil"], message: "required with a certificate" });
  }
});

export type StoreApplicationInput = z.infer<typeof storeApplicationSchema>;
