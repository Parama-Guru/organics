-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "Farmer_farmName_trgm_idx" ON "Farmer" USING GIN ("farmName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_description_trgm_idx" ON "Product" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_region_trgm_idx" ON "Product" USING GIN ("region" gin_trgm_ops);
