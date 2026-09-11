import { Repository } from "@/core/repositories/repository";
import { PasswordReset } from "../entities/password-reset";

export abstract class PasswordResetRepository extends Repository<PasswordReset> {
  abstract expirePendingByUserId(userId: string): Promise<void>;
}
