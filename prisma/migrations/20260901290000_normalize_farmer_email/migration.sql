DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Farmer"
    GROUP BY lower(trim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Farmer emails collide after lower-case normalization';
  END IF;
END $$;

UPDATE "Farmer" SET email = lower(trim(email));