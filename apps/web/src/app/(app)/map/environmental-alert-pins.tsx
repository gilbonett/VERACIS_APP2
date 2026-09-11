'use client'

import { MapMarker, useMap } from '@/components/map'
import { useUser } from '@/contexts/user-context'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EnvironmentalAlertDetailDialog,
  type EnvironmentalAlertDetailData,
} from './(dialogs)/environmental-alert-detail-dialog'
import { buildAlertsListSearchParams } from './constants/alert-list-query'
import { parseMapAlertStatus } from './constants/alert-verification'
import {
  ENVIRONMENTAL_ALERT_CREATED_DETAIL_EVENT,
  ENVIRONMENTAL_ALERTS_REFRESH_EVENT,
  type EnvironmentalAlertCreatedDetailPayload,
} from './constants/health-alerts-refresh'
import {
  ENVIRONMENTAL_CATEGORY_ID,
  ENVIRONMENTAL_EVENT_ID_TO_ICON,
} from './constants/environmental-event-ids'
import {
  ENVIRONMENTAL_ALERT_TYPES,
  ENVIRONMENTAL_ICON_BASE,
  ENVIRONMENTAL_OUTRO_ICON_ID,
} from './constants/environmental-events'
import { AlertMapPinWithIcon } from './alert-map-pin-with-icon'
import { useOpenMapAlertDetailListener } from './hooks/use-open-map-alert-detail-listener'
import { ClusterLayer } from './cluster-layer'
import { useAlertClusterSource } from './hooks/use-alert-cluster-source'
import { CLUSTER_COLORS, CLUSTER_OFFSETS } from './constants/cluster-config'

const ENVIRONMENTAL_LABEL_BY_ICON = new Map<string, string>(
  ENVIRONMENTAL_ALERT_TYPES.map((i) => [i.icon, i.label] as const),
)

const ENVIRONMENTAL_MAP_PIN_PLACEHOLDER_SRC =
  '/categories/environmental/5006.svg'

function rowHasAlertAttachments(row: Record<string, unknown>): boolean {
  const raw = row.attachments
  if (!Array.isArray(raw)) return false
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const url = (item as Record<string, unknown>).url
    if (typeof url === 'string' && url.trim().length > 0) return true
  }
  return false
}

function eventListIsEnvironmental(events: unknown): boolean {
  if (!Array.isArray(events)) return false
  return events.some(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as { categoryId?: string }).categoryId === 'string' &&
      (e as { categoryId: string }).categoryId === ENVIRONMENTAL_CATEGORY_ID,
  )
}

function parsePrimaryEnvironmentalFromEvents(events: unknown): {
  title: string
  iconSlug: string
} | null {
  if (!Array.isArray(events)) return null
  for (const raw of events) {
    if (typeof raw !== 'object' || raw === null) continue
    const ev = raw as Record<string, unknown>
    if (ev.categoryId !== ENVIRONMENTAL_CATEGORY_ID) continue

    const eventId = typeof ev.eventId === 'string' ? ev.eventId : ''
    const fromApiIcon =
      typeof ev.eventIcon === 'string' && ev.eventIcon.trim()
        ? ev.eventIcon.trim()
        : ''
    const iconSlug =
      fromApiIcon ||
      (eventId ? ENVIRONMENTAL_EVENT_ID_TO_ICON[eventId] : '') ||
      ''
    if (!iconSlug) continue

    const apiName = typeof ev.eventName === 'string' ? ev.eventName.trim() : ''
    const title =
      ENVIRONMENTAL_LABEL_BY_ICON.get(iconSlug) ||
      (apiName.length > 0 ? apiName : 'Alerta ambiental')

    return { title, iconSlug }
  }
  return null
}

function parseEnvironmentalAlertsFromApi(
  data: unknown,
): EnvironmentalAlertDetailData[] {
  if (!Array.isArray(data)) return []
  const out: EnvironmentalAlertDetailData[] = []

  for (const row of data) {
    if (typeof row !== 'object' || row === null) continue
    const r = row as Record<string, unknown>
    if (typeof r.id !== 'string') continue
    if (typeof r.lat !== 'number' || typeof r.lng !== 'number') continue
    if (!eventListIsEnvironmental(r.events)) continue

    const createdAt = typeof r.createdAt === 'string' ? r.createdAt : undefined
    if (!createdAt) continue

    const primary = parsePrimaryEnvironmentalFromEvents(r.events)
    if (!primary) continue

    const description =
      typeof r.description === 'string'
        ? r.description
        : r.description === null
          ? null
          : undefined

    out.push({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      createdAt,
      description,
      title: primary.title,
      iconSlug: primary.iconSlug,
      hasAttachments: rowHasAlertAttachments(r),
      status: parseMapAlertStatus(r.status),
    })
  }

  out.sort((a, b) => {
    const rank = (x: EnvironmentalAlertDetailData) =>
      x.status === 'ACCEPTED' ? 1 : 0
    const d = rank(a) - rank(b)
    if (d !== 0) return d
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return out
}

export function EnvironmentalAlertPins() {
  const { user } = useUser()
  const { initialState } = useMap()
  const [alerts, setAlerts] = useState<EnvironmentalAlertDetailData[]>([])
  const [selected, setSelected] = useState<EnvironmentalAlertDetailData | null>(
    null,
  )
  const alertsRef = useRef(alerts)

  alertsRef.current = alerts

  const refLat = initialState.latitude ?? user?.lastedLat
  const refLng = initialState.longitude ?? user?.lastedLng

  const load = useCallback(async (): Promise<
    EnvironmentalAlertDetailData[]
  > => {
    if (!user?.communities[0]?.communityId) {
      setAlerts([])
      return []
    }

    const params = buildAlertsListSearchParams(user.communities[0].communityId)
    const res = await fetch(`/api/alerts?${params.toString()}`, {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!res.ok) {
      console.warn(
        '[EnvironmentalAlertPins] GET /api/alerts falhou:',
        res.status,
      )
      setAlerts([])
      return []
    }

    let data: unknown
    try {
      data = await res.json()
    } catch {
      setAlerts([])
      return []
    }

    const parsed = parseEnvironmentalAlertsFromApi(data)
    setAlerts(parsed)
    return parsed
  }, [user?.communities[0]?.communityId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const handler = () => {
      void load()
    }
    window.addEventListener(ENVIRONMENTAL_ALERTS_REFRESH_EVENT, handler)
    return () =>
      window.removeEventListener(ENVIRONMENTAL_ALERTS_REFRESH_EVENT, handler)
  }, [load])

  useOpenMapAlertDetailListener(alertsRef, load, setSelected)

  useEffect(() => {
    const onCreatedOpen = (e: Event) => {
      const detail = (e as CustomEvent<EnvironmentalAlertCreatedDetailPayload>)
        .detail
      const alertId = detail?.alertId
      if (!alertId) return

      void (async () => {
        let list = alertsRef.current
        let found = list.find((a) => a.id === alertId)
        if (!found) {
          list = await load()
          found = list.find((a) => a.id === alertId)
        }
        if (found) setSelected({ ...found, openWithImageComposer: true })
      })()
    }

    window.addEventListener(
      ENVIRONMENTAL_ALERT_CREATED_DETAIL_EVENT,
      onCreatedOpen,
    )
    return () =>
      window.removeEventListener(
        ENVIRONMENTAL_ALERT_CREATED_DETAIL_EVENT,
        onCreatedOpen,
      )
  }, [load])

  const environmentalGeoJson = useAlertClusterSource(alerts)

  if (!user?.communities[0]?.communityId) return null

  return (
    <>
      <EnvironmentalAlertDetailDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        alert={selected}
        refLat={refLat}
        refLng={refLng}
      />

      <ClusterLayer
        sourceId="environmental-clusters"
        color={CLUSTER_COLORS.environmental}
        geojson={environmentalGeoJson}
        clusterOffset={CLUSTER_OFFSETS.environmental}
      >
        {(showPins) =>
          showPins &&
          alerts.map((alert) => {
            const iconSrc = `${ENVIRONMENTAL_ICON_BASE}/${alert.iconSlug}.svg`
            return (
              <MapMarker
                key={alert.id}
                lat={alert.lat}
                lng={alert.lng}
                anchor="bottom"
              >
                <div className="flex justify-center">
                  <AlertMapPinWithIcon
                    pinSrc={ENVIRONMENTAL_MAP_PIN_PLACEHOLDER_SRC}
                    iconSrc={iconSrc}
                    layout="environmental"
                    iconScaleOverride={
                      alert.iconSlug === ENVIRONMENTAL_OUTRO_ICON_ID
                        ? 1.3
                        : undefined
                    }
                    aria-label="Ver detalhes do alerta ambiental"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(alert)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
              </MapMarker>
            )
          })
        }
      </ClusterLayer>
    </>
  )
}
