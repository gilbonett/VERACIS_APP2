import { RateLimiterStore } from "@/application/stores/rate-limiter-store";

export class FakeRateLimiterStore implements RateLimiterStore {
  public deniedKeys = new Set<string>();

  async consume(key: string): Promise<boolean> {
    return !this.deniedKeys.has(key);
  }
}
