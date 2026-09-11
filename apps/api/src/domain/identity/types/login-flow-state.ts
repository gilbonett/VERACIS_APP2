export interface LoginFlowState {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
}

export interface LoginFlowChallenge extends LoginFlowState {
  twoFactorId: string;
  twoFactorChallengeId: string;
}
