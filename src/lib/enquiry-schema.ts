import { z } from "zod";

export const privateEnquirySchema = z.object({
  recipientType: z.enum(["FARMER", "STORE"]),
  recipientId: z.string().min(1).max(60),
  subject: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[^\r\n]+$/, "subject must be one line"),
  message: z.string().trim().min(20).max(1500),
  shareEmail: z.boolean().default(false),
});
