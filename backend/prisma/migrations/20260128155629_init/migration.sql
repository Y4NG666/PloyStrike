-- CreateTable
CREATE TABLE "Skin" (
    "id" VARCHAR(64) NOT NULL,
    "marketHashName" VARCHAR(255) NOT NULL,
    "buffGoodsId" INTEGER,
    "iconUrl" TEXT,

    CONSTRAINT "Skin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" SERIAL NOT NULL,
    "skinId" VARCHAR(64) NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "volume" INTEGER,
    "source" VARCHAR(32) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "matchId" VARCHAR(64) NOT NULL,
    "teamA" VARCHAR(128) NOT NULL,
    "teamB" VARCHAR(128) NOT NULL,
    "startTime" TIMESTAMP(3),
    "status" VARCHAR(32) NOT NULL,
    "winner" VARCHAR(128),
    "score" VARCHAR(32),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("matchId")
);

-- CreateIndex
CREATE INDEX "PriceHistory_skinId_source_timestamp_idx" ON "PriceHistory"("skinId", "source", "timestamp");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "Skin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
