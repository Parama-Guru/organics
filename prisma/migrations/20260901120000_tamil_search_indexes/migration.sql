-- Search only ever looked at the English columns, so on a Tamil-only site every
-- product keyword a visitor could actually type ("தக்காளி", "பால்", "நெய்")
-- returned nothing. The Tamil columns are now searched too, and they need the
-- same trigram indexes or those branches fall back to a sequential scan.
--
-- pg_trgm is script-agnostic: it indexes 3-character windows, so it works on
-- Tamil the same way it works on Latin. Tamil combining marks mean a "word" is
-- more code points than it looks, which makes trigrams if anything more
-- selective here than in English.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_nameTa_trgm_idx" ON "Product" USING GIN ("nameTa" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_descriptionTa_trgm_idx" ON "Product" USING GIN ("descriptionTa" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Category_nameTa_trgm_idx" ON "Category" USING GIN ("nameTa" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Region_nameTa_trgm_idx" ON "Region" USING GIN ("nameTa" gin_trgm_ops);
