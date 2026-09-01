import { z } from "zod";

export const CONTACT_ROLES = ["CUSTOMER", "FARMER", "STORE", "OTHER"] as const;

// Shared by the form and the route so the two cannot drift.
export const contactMessageSchema = z.object({
  // Asked first, because a buyer chasing a listing and a farmer chasing an
  // application need different people to answer them.
  role: z.enum(CONTACT_ROLES),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z
    .union([
      z
        .string()
        .trim()
        .regex(/^[+0-9][0-9 ()-]{5,19}$/, "enter a reachable phone number"),
      z.literal(""),
    ])
    .optional(),
  message: z.string().trim().min(10).max(2000),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
