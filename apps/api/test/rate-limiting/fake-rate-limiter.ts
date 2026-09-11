import { RateLimiter } from "@/core/repositories/rate-limiter";

export class FakeRateLimiter implements RateLimiter {
  private counts: Map<string, number> = new Map();
  public blocked = false;

  async consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    if (this.blocked) return false;

    const count = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, count);

    return count <= limit;
  }
}
