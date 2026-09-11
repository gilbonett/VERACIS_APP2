'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ALERT_VERIFICATION_LIKES_THRESHOLD,
  readProximityBannerDismissed,
  readTestLikeBoost,
  writeProximityBannerDismissed,
  writeTestLikeBoost,
} from '../constants/alert-verification'

export function useProximityBannerDismissedStorage(
  open: boolean,
  alertId: string | undefined,
  userId: string | undefined,
) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!open || !alertId || !userId) {
      setDismissed(false)
      return
    }
    setDismissed(readProximityBannerDismissed(userId, alertId))
  }, [open, alertId, userId])

  const markDismissed = useCallback(() => {
    if (!alertId || !userId) return
    writeProximityBannerDismissed(userId, alertId)
    setDismissed(true)
  }, [alertId, userId])

  return {
    proximityBannerDismissedStorage: dismissed,
    markProximityBannerDismissed: markDismissed,
  }
}

export function useTestLikeBoostSession(
  open: boolean,
  alertId: string | undefined,
  serverLikes: number,
) {
  const [boost, setBoost] = useState(0)

  useEffect(() => {
    if (!open || !alertId) {
      setBoost(0)
      return
    }
    const maxExtra = Math.max(
      0,
      ALERT_VERIFICATION_LIKES_THRESHOLD - serverLikes,
    )
    const raw = readTestLikeBoost(alertId)
    const clamped = Math.min(maxExtra, Math.max(0, raw))
    if (clamped !== raw) writeTestLikeBoost(alertId, clamped)
    setBoost(clamped)
  }, [open, alertId, serverLikes])

  const incrementTestLikeBoost = useCallback(() => {
    if (!alertId) return
    const maxExtra = Math.max(
      0,
      ALERT_VERIFICATION_LIKES_THRESHOLD - serverLikes,
    )
    setBoost((b) => {
      const next = Math.min(maxExtra, b + 1)
      writeTestLikeBoost(alertId, next)
      return next
    })
  }, [alertId, serverLikes])

  return { testLikeBoost: boost, incrementTestLikeBoost }
}
