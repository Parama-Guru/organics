CREATE TABLE "ProduceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameTa" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProduceItem_categoryId_nameTa_key" ON "ProduceItem"("categoryId", "nameTa");
ALTER TABLE "Farmer" ADD COLUMN "produceItemId" TEXT;
ALTER TABLE "Product" ADD COLUMN "produceItemId" TEXT;
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_produceItemId_fkey" FOREIGN KEY ("produceItemId") REFERENCES "ProduceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_produceItemId_fkey" FOREIGN KEY ("produceItemId") REFERENCES "ProduceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Product_produceItemId_idx" ON "Product"("produceItemId");

INSERT INTO "Category" ("id", "slug", "name", "nameTa", "updatedAt") VALUES
('produce-grains-pulses', 'grains-and-pulses', 'Grains & Pulses', 'தானியங்களின் பட்டியல்', CURRENT_TIMESTAMP),
('produce-fruits', 'fresh-fruits', 'Fresh Fruits', 'பழங்களின் பட்டியல்', CURRENT_TIMESTAMP),
('produce-leafy-greens', 'leafy-greens', 'Leafy greens', 'கீரைகளின் பட்டியல்', CURRENT_TIMESTAMP),
('produce-vegetables', 'fresh-vegetables', 'Fresh Vegetables', 'காய்கறிகளின் பட்டியல்', CURRENT_TIMESTAMP),
('produce-traditional-rice', 'traditional-rice', 'Traditional rice', 'பாரம்பரிய நெல் வகைகள்', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET "nameTa" = EXCLUDED."nameTa";

WITH lists(slug, items) AS (VALUES
('grains-and-pulses', '["அவரை","எள்ளு","கடலை","மொச்சை","சோளம்","கம்பு","கேழ்வரகு","கொள்ளு","கோதுமை","துவரை","உளுந்து","சோயாபீன்ஸ்","பட்டர்பீன்ஸ்","பட்டாணி","காராமணி","வரகு","சாமை","திணை"]'::jsonb),
('fresh-fruits', '["அரைநெல்லி","அன்னாசிப்பழம்","ஆரஞ்சுப் பழம்","ஆப்பிள்","எலுமிச்சைபழம்","ஈச்சம்பழம்","கடார நாரத்தங்காய்","கொறுக்காய்ப்புளி","கொய்யாப்பழம்","சப்போட்டா","சாத்துக்குடி","சீத்தாப்பழம்","பனம்பழம்","பலாப்பழம்","பப்பாளி","புளியம்பழம்","பேரீச்சைப்பழம்","வாழைப்பழம்","விளாம்பழம்","வேப்பம்பழம்","திராட்சை","நாவற்பழம்","நெல்லி","மாம்பழம்","மாதுளம் பழம்"]'::jsonb),
('leafy-greens', '["புதினா","கொத்தமல்லி","அகத்திக் கீரை","அறைக்கீரை","தண்டுக்கீரை","துத்திக்கீரை","கரிசலாங்கண்ணி","காசினிக்கீரை","சிறுகீரை","வல்லாரை","வெந்தயக்கீரை","பருப்புக்கீரை","பசலைக்கீரை","பண்ணைக்கீரை","புளிச்சக்கீரை","பொன்னாங்காணி","மஞ்சள் கரிசலாங்கண்ணிக் கீரை","மணத்தக்காளி","முருங்கைக்கீரை","முள்ளுக்கீரை","முளைக்கீரை","முடக்கற்றான் கீரை","முள்ளங்கிக்கீரை","சிகப்பு முள்ளங்கி"]'::jsonb),
('fresh-vegetables', '["அவரைக்காய்","உருளைக்கிழங்கு","எலுமிச்சை","கத்தரிக்காய்","கருணைக்கிழங்கு","காலிபிளவர்","கேரட்","கொத்தவரைக்காய்","கோவைக்காய்","சுண்டைக்காய்","முருங்கைக்காய்","முள்ளங்கி","தக்காளி","சுரைக்காய்","சேனைக்கிழங்கு","சேப்பங்கிழங்கு","முட்டைக்கோஸ்","வாழைத் தண்டு","வாழைக்காய்","வெண்டைக்காய்","வெள்ளரிக்காய்","வெங்காயம்","பாகற்காய்","புடலங்காய்","ப்ரோக்கோலி","பூசணிக்காய்","பீட்ரூட்","பீர்க்கங்காய்","மரவள்ளிக்கிழங்கு","மாங்காய்","நெல்லிக்காய்"]'::jsonb),
('traditional-rice', '["ஆத்தூர்கிச்சிலிசம்பா","மாப்பிள்ளைச்சம்பா","கிச்சிலிச்சம்பா","கருடன்சம்பா","வாடன்சம்பா","தேங்காய்ப்பூச்சம்பா","இலுப்பைப்பூ சம்பா","பூங்கார்","அறுபதாங்குறுவை","கருப்பு சீரகச் சம்பா","குள்ளக்கார்","கருப்பு கவுனி","தூயமல்லி","கருங்குறுவை","காட்டுயானம்"]'::jsonb)
)
INSERT INTO "ProduceItem" ("id", "nameTa", "categoryId")
SELECT lists.slug || '-' || item.position, item.name, category.id
FROM lists JOIN "Category" category ON category.slug = lists.slug
CROSS JOIN LATERAL jsonb_array_elements_text(lists.items) WITH ORDINALITY AS item(name, position);