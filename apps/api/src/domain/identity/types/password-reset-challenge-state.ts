export interface PasswordResetChallengeSecretState {
  secretHash: string;
  attempts: number;
  maxAttempts: number;
}
