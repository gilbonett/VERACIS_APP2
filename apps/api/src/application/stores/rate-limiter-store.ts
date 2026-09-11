export abstract class RateLimiterStore {
  abstract consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean>;
}
