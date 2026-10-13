import { z } from "zod";

import { farmerCertificateFields, validateFarmerCertificate } from "./farmer-certification";
import { validProduceSelection } from "./produce-taxonomy";

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
  produceType: z.string().max(60),
  produceItemId: z.string().max(80),
  // Last four digits only; the full ID is never collected or stored.
  govtIdLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "enter the last 4 digits"),
  ...farmerCertificateFields,
}).superRefine(validateFarmerCertificate).refine(
  (value) => validProduceSelection(value.produceType, value.produceItemId),
  { path: ["produceItemId"], message: "choose an item from the selected type" },
);

export type FarmerApplicationInput = z.infer<typeof farmerApplicationSchema>;
