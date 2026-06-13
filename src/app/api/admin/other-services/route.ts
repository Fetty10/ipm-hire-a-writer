-- Create OtherService table for admin-managed services
CREATE TABLE IF NOT EXISTS "OtherService" (
  "id"           TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "label"        TEXT NOT NULL,
  "value"        TEXT NOT NULL UNIQUE,
  "description"  TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  "priceOND"     INTEGER NOT NULL DEFAULT 0,
  "priceBSC"     INTEGER NOT NULL DEFAULT 0,
  "pricePGD"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed with existing services
INSERT INTO "OtherService" ("id","label","value","priceOND","priceBSC","pricePGD","sortOrder") VALUES
  (gen_random_uuid()::text, 'Seminar Paper',        'seminar',    1000000, 1000000, 2000000, 1),
  (gen_random_uuid()::text, 'Research Proposal',    'proposal',   1000000, 1000000, 2000000, 2),
  (gen_random_uuid()::text, 'Journal / Article',    'journal',    1000000, 1000000, 2000000, 3),
  (gen_random_uuid()::text, 'Topic Coining',        'topic',       200000,  200000,  200000, 4),
  (gen_random_uuid()::text, 'Assignment',           'assignment',  300000,  300000,  500000, 5)
ON CONFLICT ("value") DO NOTHING;
