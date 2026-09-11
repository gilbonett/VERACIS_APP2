export const COMMUNITY_PROXIMITY_PROMPT_DELAY_MS = 5_000

const STORAGE_KEY = 'veracis.communityProximity.unlockedAlertIds'

export function getPersistedUnlockedAlertIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

export function persistUnlockedAlertId(alertId: string): void {
  if (typeof window === 'undefined') return
  const set = getPersistedUnlockedAlertIds()
  if (set.has(alertId)) return
  set.add(alertId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}
