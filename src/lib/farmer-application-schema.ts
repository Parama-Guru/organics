import { z } from "zod";

import { endOfIndiaDate } from "./india-date";

// Shared by the form and the route so the two cannot drift.
export const farmerApplicationSchema = z.object({
  farmName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: z.email().max(200).toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[+0-9][0-9 ()-]{5,19}$/, "enter a reachable phone number"),
  region: z.string().trim().min(2).max(80),
  about: z.string().trim().min(20).max(1000),
  // Last four digits only; the full ID is never collected or stored.
  govtIdLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "enter the last 4 digits"),
  // Required: the site publishes the scheme and certificate number for every
  // listed farm, so it cannot accept a farm that has not supplied one.
  certifier: z.string().trim().min(3).max(160),
  certificateNo: z.string().trim().min(3).max(80),
  // Required because an undated or expired certificate cannot support a
  // continuing verified-organic claim.
  certifiedUntil: z.iso.date().refine((value) => {
    const expiry = endOfIndiaDate(value);
    return Boolean(expiry && expiry > new Date());
  }, "certificate expiry must be in the future"),
  certificateUrl: z.union([z.url().max(500), z.literal("")]).optional(),
});

export type FarmerApplicationInput = z.infer<typeof farmerApplicationSchema>;
