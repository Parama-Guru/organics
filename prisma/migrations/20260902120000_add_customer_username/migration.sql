-- Public handle for buyer accounts.
--
-- Nullable: accounts created before handles existed keep working, and Postgres
-- allows many NULLs under a unique index, so no backfill is needed.
--
-- The CHECK is what actually guarantees the format. Normalising in application
-- code alone would let a future code path insert "Ravi" beside "ravi" and defeat
-- the unique index, which compares case-sensitively.
ALTER TABLE "Customer" ADD COLUMN "username" TEXT;

ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_username_format"
  CHECK ("username" IS NULL OR "username" ~ '^[a-z0-9_]{3,20}$');

CREATE UNIQUE INDEX "Customer_username_key" ON "Customer"("username");
