import { seconds } from "@/shared/constants/temporal.constants";

export const POLLER_BATCH_SIZE = 50;
export const POLLER_STALE_AFTER_MS = seconds(30);
export const POLLER_MAX_ATTEMPTS = 5;
