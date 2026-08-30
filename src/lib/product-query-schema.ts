import { z } from "zod";

export const PRODUCT_SORTS = ["name", "price-asc", "price-desc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

// Public catalogue query params. Order/checkout schemas lived here too until the
// cart was removed; buyers now contact the farmer directly.
export const productQuerySchema = z.object({
  category: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(PRODUCT_SORTS).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
});
