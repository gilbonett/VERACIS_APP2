const STORAGE_KEY = 'veracis:health-alerts:finalize-pending'

const PENDING_WINDOW_MS = 30 * 60 * 1000
const STORAGE_RETENTION_MS = 24 * 60 * 60 * 1000

type StoredMap = Record<string, string>

function loadRaw(): StoredMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: StoredMap = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function persist(data: StoredMap): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota / private mode */
  }
}

export function getHealthAlertFinalizePendingIdSet(): Set<string> {
  return getHealthAlertFinalizeState().pendingIds
}

export function getHealthAlertFinalizeState(): {
  pendingIds: Set<string>
  hiddenIds: Set<string>
} {
  const raw = loadRaw()
  const now = Date.now()
  const kept: StoredMap = {}
  const pendingIds = new Set<string>()
  const hiddenIds = new Set<string>()

  for (const [id, iso] of Object.entries(raw)) {
    const t = Date.parse(iso)
    if (Number.isNaN(t)) continue
    const elapsedMs = now - t
    if (elapsedMs > STORAGE_RETENTION_MS) continue

    kept[id] = iso

    if (elapsedMs >= PENDING_WINDOW_MS) {
      hiddenIds.add(id)
      continue
    }

    pendingIds.add(id)
  }
  persist(kept)
  return { pendingIds, hiddenIds }
}

export function markHealthAlertFinalizePending(alertId: string): void {
  const raw = loadRaw()
  raw[alertId] = new Date().toISOString()
  persist(raw)
}
