-- CreateIndex
CREATE INDEX "alerts_lat_lng_idx" ON "alerts"("lat", "lng");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_author_id_community_id_category_id_idx" ON "alerts"("author_id", "community_id", "category_id");
