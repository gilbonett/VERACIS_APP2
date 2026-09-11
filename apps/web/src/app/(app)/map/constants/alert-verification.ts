export const ALERT_VERIFICATION_LIKES_THRESHOLD = 5

export const MAP_ALERT_VERIFIED_BADGE_ICON_SRC = '/categories/1012.svg'

export type MapAlertHttpStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CLOSED'

export function parseMapAlertStatus(raw: unknown): MapAlertHttpStatus {
  if (raw === 'ACCEPTED' || raw === 'REJECTED' || raw === 'CLOSED') return raw
  return 'PENDING'
}

export type MapAlertUserReaction = 'LIKE' | 'DISLIKE'

export function isMapAlertCommunityVerified(
  alertStatus: MapAlertHttpStatus,
): boolean {
  return alertStatus === 'ACCEPTED'
}

export function shouldShowCommunityProximityActions(args: {
  alertStatus: MapAlertHttpStatus
  currentUserReaction: MapAlertUserReaction | null | undefined
}): boolean {
  const { alertStatus, currentUserReaction } = args
  if (isMapAlertCommunityVerified(alertStatus)) return false
  return alertStatus === 'PENDING' && currentUserReaction == null
}

const proximitySessionKey = (userId: string, alertId: string) =>
  `veracis:map:proximity-banner:${userId}:${alertId}`

const testBoostSessionKey = (alertId: string) =>
  `veracis:map:test-like-boost:${alertId}`

export function readProximityBannerDismissed(
  userId: string,
  alertId: string,
): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(proximitySessionKey(userId, alertId)) === '1'
}

export function writeProximityBannerDismissed(
  userId: string,
  alertId: string,
): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(proximitySessionKey(userId, alertId), '1')
}

export function readTestLikeBoost(alertId: string): number {
  if (typeof window === 'undefined') return 0
  const v = Number.parseInt(
    sessionStorage.getItem(testBoostSessionKey(alertId)) ?? '0',
    10,
  )
  return Number.isNaN(v) ? 0 : Math.max(0, v)
}

export function writeTestLikeBoost(alertId: string, value: number): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(testBoostSessionKey(alertId), String(value))
}

export function getAlertVerificationUi(args: {
  likesCount: number
  testLikeBoost: number
  alertStatus: MapAlertHttpStatus
}): {
  displayLikes: number
  validationProgressLabel: string
  isVerifiedUi: boolean
} {
  const { likesCount, testLikeBoost, alertStatus } = args
  const cap = ALERT_VERIFICATION_LIKES_THRESHOLD
  const isVerifiedUi = isMapAlertCommunityVerified(alertStatus)
  const displayLikes = isVerifiedUi
    ? cap
    : Math.min(cap, likesCount + testLikeBoost)
  const validationProgressLabel = `${displayLikes}/${cap}`
  return { displayLikes, validationProgressLabel, isVerifiedUi }
}
