import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { endOfIndiaDate } from "./india-date";

export const farmerCertificateFields = {
  certifier: z.string().trim().max(160).default(""),
  certificateNo: z.string().trim().max(80).default(""),
  certifiedUntil: z.union([z.iso.date(), z.literal("")]).default(""),
  certificateUrl: z.union([z.url().max(500), z.literal("")]).default(""),
};

export function validateFarmerCertificate(
  value: { certifier: string; certificateNo: string; certifiedUntil: string; certificateUrl: string },
  context: z.RefinementCtx,
) {
  if (!value.certifier && !value.certificateNo && !value.certifiedUntil && !value.certificateUrl) return;
  if (value.certifier.length < 3) context.addIssue({ code: "custom", path: ["certifier"], message: "complete the optional certificate details" });
  if (value.certificateNo.length < 3) context.addIssue({ code: "custom", path: ["certificateNo"], message: "complete the optional certificate details" });
  const expiry = endOfIndiaDate(value.certifiedUntil);
  if (!expiry || expiry <= new Date()) context.addIssue({ code: "custom", path: ["certifiedUntil"], message: "certificate expiry must be in the future" });
}

export function publicFarmerWhere(now = new Date()): Prisma.FarmerWhereInput {
  return {
    status: "VERIFIED",
    OR: [
      { certifier: null, certificateNo: null, certifiedUntil: null, certificateUrl: null },
      { certifier: { not: null }, certificateNo: { not: null }, certifiedUntil: { gte: now } },
    ],
  };
}

export function hasAcceptableFarmerCertificate(farmer: {
  certifier: string | null; certificateNo: string | null;
  certificateUrl: string | null; certifiedUntil: Date | null;
}, now = new Date()): boolean {
  if (!farmer.certifier && !farmer.certificateNo && !farmer.certificateUrl && !farmer.certifiedUntil) return true;
  return Boolean(farmer.certifier && farmer.certificateNo && farmer.certifiedUntil && farmer.certifiedUntil >= now);
}