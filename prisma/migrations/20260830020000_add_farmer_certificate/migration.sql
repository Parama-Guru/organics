-- "Certified organic" is a regulated claim in India (NPOP / India Organic,
-- PGS-India, Jaivik Bharat). Recording the scheme, the certificate number and
-- its expiry means the site can show the evidence for the claim instead of
-- asserting it.
ALTER TABLE "Farmer" ADD COLUMN "certifier" TEXT;
ALTER TABLE "Farmer" ADD COLUMN "certificateNo" TEXT;
ALTER TABLE "Farmer" ADD COLUMN "certifiedUntil" TIMESTAMP(3);
