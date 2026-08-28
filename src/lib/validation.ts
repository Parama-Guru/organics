import { z } from "zod";

export const orderItemInputSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  quantity: z.number().int().min(1).max(50),
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(100),
  items: z.array(orderItemInputSchema).min(1).max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const productQuerySchema = z.object({
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
