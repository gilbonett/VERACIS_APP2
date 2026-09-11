import {
  AUTH_STORE_PREFIXES,
  AuthStore,
} from "@/application/stores/auth-store";
import { RateLimiterStore } from "@/application/stores/rate-limiter-store";
import { Either, left, right } from "@/core/either";
import { HashComparer } from "@/domain/cryptography/hash-comparer";
import { HashGenerator } from "@/domain/cryptography/hash-generator";
import { TokenOpaque } from "@/domain/cryptography/token-opaque";
import { TwoFactorType } from "@/domain/identity/entities/two-factor";
import { AccountTemporarilyLockedError } from "@/domain/identity/errors/account-temporarily-locked-error";
import { InvalidCredentialsError } from "@/domain/identity/errors/invalid-credential-error";
import { TooManyLoginAttemptsError } from "@/domain/identity/errors/too-many-login-attempts-error";
import { AccountRepository } from "@/domain/identity/repositories/account-repository";
import { TwoFactorRepository } from "@/domain/identity/repositories/two-factor-repository";
import { UserRepository } from "@/domain/identity/repositories/user-repository";
import { enforceLoginRateLimit } from "@/domain/identity/services/enforce-login-rate-limit";
import { LoginFlowState } from "@/domain/identity/types/login-flow-state";
import { Injectable } from "@nestjs/common";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";

const LOGIN_FLOW_TTL_SECONDS = 10 * 60;

interface SignInUseCaseRequest {
  cpf: string;
  password: string;
  ipAddress: string;
  userAgent: string;
  deviceName: string;
}

type SignInUseCaseAuthenticated = {
  status: "AUTHENTICATED";
  refreshToken: string;
  accessToken: string;
};

type SignInUseCaseTwoFactorRequired = {
  status: "TWO_FACTOR_REQUIRED";
  loginAttemptToken: string;
  methods: Array<{ twoFactorId: string; type: TwoFactorType }>;
};

type SignInUseCaseResponse = Either<
  | TooManyLoginAttemptsError
  | InvalidCredentialsError
  | AccountTemporarilyLockedError,
  SignInUseCaseAuthenticated | SignInUseCaseTwoFactorRequired
>;

@Injectable()
export class SignInUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashComparer: HashComparer,
    private hashGenerator: HashGenerator,
    private accountRepository: AccountRepository,
    private twoFactorRepository: TwoFactorRepository,
    private authStore: AuthStore,
    private rateLimiter: RateLimiterStore,
    private tokenOpaque: TokenOpaque,
    private issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase,
  ) {}

  async execute(request: SignInUseCaseRequest): Promise<SignInUseCaseResponse> {
    const rateLimitCheck = await enforceLoginRateLimit(
      this.rateLimiter,
      request.cpf,
      request.ipAddress,
    );

    if (rateLimitCheck.isLeft()) {
      return left(rateLimitCheck.value);
    }

    const user = await this.userRepository.findUniqueByCpf(request.cpf);

    if (!user || !user.isActive) {
      await this.hashGenerator.hash(request.password);
      return left(new InvalidCredentialsError());
    }

    const account = await this.accountRepository.findCredentialByUserId(
      user.id.toString(),
    );

    if (!account) {
      await this.hashGenerator.hash(request.password);
      return left(new InvalidCredentialsError());
    }

    if (account.isLocked) {
      return left(new AccountTemporarilyLockedError());
    }

    if (!account.passwordHash) {
      return left(new InvalidCredentialsError());
    }

    const isPasswordValid = await this.hashComparer.compare(
      request.password,
      account.passwordHash,
    );

    if (!isPasswordValid) {
      account.incrementFailedAttempts();
      await this.accountRepository.save(account);
      return left(new InvalidCredentialsError());
    }

    account.resetFailedAttempts();
    await this.accountRepository.save(account);

    const twoFactorEnableds =
      await this.twoFactorRepository.findEnabledByUserId(user.id.toString());

    if (twoFactorEnableds.length === 0) {
      const { accessToken, refreshToken } =
        await this.issueAuthenticatedSessionUseCase.execute({
          userId: user.id.toString(),
          assuranceLevel: "LOW",
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          deviceName: request.deviceName,
        });

      return right({
        status: "AUTHENTICATED",
        accessToken,
        refreshToken,
      });
    }

    const loginAttemptToken = this.tokenOpaque.generate();

    const flowState: LoginFlowState = {
      userId: user.id.toString(),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      deviceName: request.deviceName,
    };

    await this.authStore.issue(
      AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
      loginAttemptToken.hashed,
      flowState,
      LOGIN_FLOW_TTL_SECONDS,
    );

    return right({
      status: "TWO_FACTOR_REQUIRED",
      loginAttemptToken: loginAttemptToken.plain,
      methods: twoFactorEnableds.map((factor) => ({
        twoFactorId: factor.id.toString(),
        type: factor.type,
      })),
    });
  }
}
