export function buildAlertsListSearchParams(
  communityId: string,
): URLSearchParams {
  const p = new URLSearchParams()
  p.set('communityId', communityId)
  p.append('status', 'PENDING')
  p.append('status', 'ACCEPTED')
  return p
}
