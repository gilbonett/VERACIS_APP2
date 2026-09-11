// domain/identity/use-cases/revoke-two-factor-on-contact-change.use-case.ts
import { TwoFactorType } from "@/domain/identity/entities/two-factor";
import { TwoFactorRepository } from "@/domain/identity/repositories/two-factor-repository";
import { Injectable } from "@nestjs/common";

interface RevokeTwoFactorOnContactChangeRequest {
  userId: string;
  type: Extract<TwoFactorType, "EMAIL" | "SMS">; // nunca TOTP - segredo não depende de contato
}

@Injectable()
export class RevokeTwoFactorOnContactChangeUseCase {
  constructor(private twoFactorRepository: TwoFactorRepository) {}

  async execute({
    userId,
    type,
  }: RevokeTwoFactorOnContactChangeRequest): Promise<void> {
    const twoFactor = await this.twoFactorRepository.findByUserIdAndType(
      userId,
      type,
    );
    if (!twoFactor || twoFactor.isDisabled || twoFactor.isRevoked) return;

    twoFactor.revoke();

    await this.twoFactorRepository.save(twoFactor);
  }
}
