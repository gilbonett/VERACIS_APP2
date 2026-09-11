export interface FederatedOnboardingState {
  provider: string
  providerSub: string
  providerEmail: string | null
  providerName: string | null
  cpfFromProvider: string | null
  rawAssuranceClaim: string | null
  accessToken: string
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: string | null
  scope: string | null
}
