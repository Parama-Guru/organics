CREATE TABLE "VisitorBrowser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastDay" TEXT NOT NULL
);
CREATE TABLE "VisitorCount" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0
);