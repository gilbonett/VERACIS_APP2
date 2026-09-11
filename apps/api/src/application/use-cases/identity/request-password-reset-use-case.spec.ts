import { PasswordResetChallenge } from "@/domain/identity/entities/password-reset-challenge";
import { PasswordResetRequestedEvent } from "@/domain/identity/events/password-reset-requested-event";
import { Email } from "@/domain/identity/value-objects/email";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { makeUser } from "../../../../test/factories/make-user";
import { FakeRateLimiter } from "../../../../test/rate-limiting/fake-rate-limiter";
import { InMemoryPasswordResetChallengeRepository } from "../../../../test/repositories/in-memory-password-reset-challenge-repository";
import { InMemoryUserRepository } from "../../../../test/repositories/in-memory-user-repository";
import { RequestPasswordResetUseCase } from "./request-password-reset-use-case";

let sut: RequestPasswordResetUseCase;
let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryPasswordResetChallengeRepository: InMemoryPasswordResetChallengeRepository;
let fakeTokenOpaque: FakeTokenOpaque;
let fakeRateLimiter: FakeRateLimiter;

const validRequest = {
  email: "maria.silva@example.com",
  ipAddress: "10.0.0.1",
  userAgent: "vitest",
  deviceName: "windows",
};

describe("Request Password Reset Use Case", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    inMemoryPasswordResetChallengeRepository =
      new InMemoryPasswordResetChallengeRepository();
    fakeTokenOpaque = new FakeTokenOpaque();
    fakeRateLimiter = new FakeRateLimiter();
    sut = new RequestPasswordResetUseCase(
      inMemoryUserRepository,
      inMemoryPasswordResetChallengeRepository,
      fakeTokenOpaque,
      fakeRateLimiter,
    );
  });

  describe("when the email is not registered", () => {
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      result = await sut.execute(validRequest);
    });

    it("should still return a generic success", () => {
      expect(result.isRight()).toBe(true);
    });

    it("should not create a password reset challenge", () => {
      expect(inMemoryPasswordResetChallengeRepository.items).toHaveLength(0);
    });
  });

  describe("when the email is registered", () => {
    let user: ReturnType<typeof makeUser>;
    let result: Awaited<ReturnType<typeof sut.execute>>;
    let challenge: PasswordResetChallenge;
    let event: PasswordResetRequestedEvent;
    let before: number;
    let after: number;

    beforeEach(async () => {
      user = makeUser({ email: Email.fromString(validRequest.email) });
      inMemoryUserRepository.items.push(user);

      before = Date.now();
      result = await sut.execute(validRequest);
      after = Date.now();

      challenge = inMemoryPasswordResetChallengeRepository.items[0];
      event = challenge.domainEvents.find(
        (e) => e instanceof PasswordResetRequestedEvent,
      ) as PasswordResetRequestedEvent;
    });

    it("should return a generic success", () => {
      expect(result.isRight()).toBe(true);
    });

    it("should create exactly one pending challenge, owned by that user", () => {
      expect(inMemoryPasswordResetChallengeRepository.items).toHaveLength(1);
      expect(challenge.userId.equals(user.id)).toBe(true);
      expect(challenge.status).toBe("PENDING");
    });

    it("should expire roughly 30 minutes from now", () => {
      const TTL_MS = 30 * 60 * 1000;
      expect(challenge.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + TTL_MS,
      );
      expect(challenge.expiresAt.getTime()).toBeLessThanOrEqual(after + TTL_MS);
    });

    it("should emit a PasswordResetRequestedEvent with the user's email and a token", () => {
      expect(event).toBeDefined();
      expect(event.payload.email).toBe(validRequest.email);
      expect(event.payload.token).toBeTruthy();
    });

    it("should store the delivered token's hash on the challenge itself", () => {
      expect(challenge.tokenHash).toBe(
        fakeTokenOpaque.generate(event.payload.token).hashed,
      );
    });
  });
});
