'use client'

import { useEffect } from 'react'
import {
  consumePendingOpenMapAlertId,
  dispatchOpenMapAlertDetail,
} from './constants/open-map-alert-detail'


export function MapOpenPendingAlertFromNotification() {
  useEffect(() => {
    const alertId = consumePendingOpenMapAlertId()
    if (!alertId) return
    dispatchOpenMapAlertDetail({ alertId })
  }, [])

  return null
}
