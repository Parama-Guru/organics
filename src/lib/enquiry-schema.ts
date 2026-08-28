import { z } from "zod";

// Same shape the API validates, kept here so the form and the route cannot drift.
export const enquirySchema = z.object({
  productId: z.string().min(1).max(60),
  customerName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .regex(/^[+0-9][0-9 ()-]{5,19}$/, "enter a reachable phone number"),
  email: z.union([z.email().max(200), z.literal("")]).optional(),
  quantity: z.coerce.number().int().min(1).max(500),
  preferredDate: z.union([z.iso.date(), z.literal("")]).optional(),
  note: z.string().trim().max(600).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
