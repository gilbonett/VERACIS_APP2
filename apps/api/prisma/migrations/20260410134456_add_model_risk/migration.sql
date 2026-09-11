-- CreateTable
CREATE TABLE "alert_risks" (
    "risk_id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,

    CONSTRAINT "alert_risks_pkey" PRIMARY KEY ("risk_id","alert_id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "risks_slug_key" ON "risks"("slug");

-- CreateIndex
CREATE INDEX "risks_slug_idx" ON "risks"("slug");

-- AddForeignKey
ALTER TABLE "alert_risks" ADD CONSTRAINT "alert_risks_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_risks" ADD CONSTRAINT "alert_risks_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
