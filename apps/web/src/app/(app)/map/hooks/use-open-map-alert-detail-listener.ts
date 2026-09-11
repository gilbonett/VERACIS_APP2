'use client'

import { useEffect, type RefObject } from 'react'
import {
  dispatchMapFlyToCoordinates,
  OPEN_MAP_ALERT_DETAIL_EVENT,
  type OpenMapAlertDetailPayload,
} from '../constants/open-map-alert-detail'

type MapAlertListItem = {
  id: string
  lat: number
  lng: number
}

export function useOpenMapAlertDetailListener<T extends MapAlertListItem>(
  alertsRef: RefObject<T[]>,
  load: () => Promise<T[]>,
  setSelected: (alert: T) => void,
) {
  useEffect(() => {
    const onOpen = (e: Event) => {
      const alertId = (e as CustomEvent<OpenMapAlertDetailPayload>).detail
        ?.alertId
      if (!alertId) return

      void (async () => {
        let list = alertsRef.current
        let found = list.find((a) => a.id === alertId)
        if (!found) {
          list = await load()
          found = list.find((a) => a.id === alertId)
        }
        if (!found) return

        dispatchMapFlyToCoordinates({ lat: found.lat, lng: found.lng })
        setSelected(found)
      })()
    }

    window.addEventListener(OPEN_MAP_ALERT_DETAIL_EVENT, onOpen)
    return () =>
      window.removeEventListener(OPEN_MAP_ALERT_DETAIL_EVENT, onOpen)
  }, [alertsRef, load, setSelected])
}
