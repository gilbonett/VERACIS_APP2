'use client'

import { useEffect, useState } from 'react'
import {
  COMMUNITY_PROXIMITY_PROMPT_DELAY_MS,
  getPersistedUnlockedAlertIds,
  persistUnlockedAlertId,
} from '../constants/community-proximity-prompt'

export function useCommunityProximityReady(
  open: boolean,
  alertId: string | undefined,
  createdAt: string | undefined,
): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open || !alertId || !createdAt) {
      setReady(false)
      return
    }

    if (getPersistedUnlockedAlertIds().has(alertId)) {
      setReady(true)
      return
    }

    const createdMs = new Date(createdAt).getTime()
    if (Number.isNaN(createdMs)) {
      setReady(false)
      return
    }

    const elapsed = Date.now() - createdMs
    if (elapsed >= COMMUNITY_PROXIMITY_PROMPT_DELAY_MS) {
      persistUnlockedAlertId(alertId)
      setReady(true)
      return
    }

    const remaining = COMMUNITY_PROXIMITY_PROMPT_DELAY_MS - elapsed
    const t = window.setTimeout(() => {
      persistUnlockedAlertId(alertId)
      setReady(true)
    }, remaining)

    return () => window.clearTimeout(t)
  }, [open, alertId, createdAt])

  return ready
}
