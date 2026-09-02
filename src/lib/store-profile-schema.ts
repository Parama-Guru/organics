import { z } from "zod";

export const storeProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[+0-9][0-9 ()-]{5,19}$/, "enter a reachable phone number"),
  addressLine: z.string().trim().min(6).max(240),
  about: z.string().trim().min(20).max(1000),
  aboutTa: z.union([z.string().trim().max(1000), z.literal("")]).optional(),
});

export type StoreProfileInput = z.infer<typeof storeProfileSchema>;
