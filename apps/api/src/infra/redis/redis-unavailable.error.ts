export class RedisUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Redis unavailable");
    this.cause = cause;
  }
}
