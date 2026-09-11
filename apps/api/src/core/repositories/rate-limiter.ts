export abstract class RateLimiter {
  abstract consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean>;
}
