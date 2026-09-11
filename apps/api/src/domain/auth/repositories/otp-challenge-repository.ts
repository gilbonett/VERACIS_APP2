import { Repository } from "@/core/repositories/repository";
import { OtpChallenge } from "../entities/otp-challenge";

export abstract class OtpChallengeRepository extends Repository<OtpChallenge> {
  abstract expirePendingByUserId(userId: string): Promise<void>;
}
