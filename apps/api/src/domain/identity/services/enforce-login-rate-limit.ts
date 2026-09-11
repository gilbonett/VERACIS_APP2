import { Either, left, right } from "@/core/either";
import { RateLimiter } from "@/core/repositories/rate-limiter";
import { TooManyLoginAttemptsError } from "../errors/too-many-login-attempts-error";

const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;

export async function enforceLoginRateLimit(
  rateLimiter: RateLimiter,
  cpf: string,
  ipAddress: string,
): Promise<Either<TooManyLoginAttemptsError, void>> {
  const [cpfAllowed, ipAllowed] = await Promise.all([
    rateLimiter.consume(
      `login:cpf:${cpf}`,
      LOGIN_ATTEMPT_LIMIT,
      LOGIN_ATTEMPT_WINDOW_SECONDS,
    ),
    rateLimiter.consume(
      `login:ip:${ipAddress}`,
      LOGIN_ATTEMPT_LIMIT,
      LOGIN_ATTEMPT_WINDOW_SECONDS,
    ),
  ]);

  if (!cpfAllowed || !ipAllowed) {
    return left(new TooManyLoginAttemptsError());
  }

  return right(undefined);
}
