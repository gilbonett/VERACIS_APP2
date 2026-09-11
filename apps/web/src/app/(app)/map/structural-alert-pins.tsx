'use client'

import { MapMarker, useMap } from '@/components/map'
import { useUser } from '@/contexts/user-context'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  StructuralAlertDetailDialog,
  type StructuralAlertDetailData,
} from './(dialogs)/structural-alert-detail-dialog'
import { buildAlertsListSearchParams } from './constants/alert-list-query'
import { parseMapAlertStatus } from './constants/alert-verification'
import {
  STRUCTURAL_ALERT_CREATED_DETAIL_EVENT,
  STRUCTURAL_ALERTS_REFRESH_EVENT,
  type StructuralAlertCreatedDetailPayload,
} from './constants/health-alerts-refresh'
import {
  STRUCTURAL_CATEGORY_ID,
  STRUCTURAL_EVENT_ID_TO_ICON,
} from './constants/structural-event-ids'
import {
  STRUCTURAL_ALERT_TYPES,
  STRUCTURAL_ICON_BASE,
  STRUCTURAL_OUTRO_ICON_ID,
} from './constants/structural-events'
import { AlertMapPinWithIcon } from './alert-map-pin-with-icon'
import { useOpenMapAlertDetailListener } from './hooks/use-open-map-alert-detail-listener'
import { ClusterLayer } from './cluster-layer'
import { useAlertClusterSource } from './hooks/use-alert-cluster-source'
import { CLUSTER_COLORS, CLUSTER_OFFSETS } from './constants/cluster-config'

const STRUCTURAL_LABEL_BY_ICON = new Map<string, string>(
  STRUCTURAL_ALERT_TYPES.map((i) => [i.icon, i.label] as const),
)

const STRUCTURAL_MAP_PIN_SRC = `${STRUCTURAL_ICON_BASE}/6006.svg`

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

function eventListIsStructural(events: unknown): boolean {
  if (!Array.isArray(events)) return false
  return events.some(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as { categoryId?: string }).categoryId === 'string' &&
      (e as { categoryId: string }).categoryId === STRUCTURAL_CATEGORY_ID,
  )
}

function parsePrimaryStructuralFromEvents(events: unknown): {
  title: string
  iconSlug: string
} | null {
  if (!Array.isArray(events)) return null
  for (const raw of events) {
    if (typeof raw !== 'object' || raw === null) continue
    const ev = raw as Record<string, unknown>
    if (ev.categoryId !== STRUCTURAL_CATEGORY_ID) continue

    const eventId = typeof ev.eventId === 'string' ? ev.eventId : ''
    const fromApiIcon =
      typeof ev.eventIcon === 'string' && ev.eventIcon.trim()
        ? ev.eventIcon.trim()
        : ''
    const iconSlug =
      fromApiIcon || (eventId ? STRUCTURAL_EVENT_ID_TO_ICON[eventId] : '') || ''
    if (!iconSlug) continue

    const apiName = typeof ev.eventName === 'string' ? ev.eventName.trim() : ''
    const title =
      STRUCTURAL_LABEL_BY_ICON.get(iconSlug) ||
      (apiName.length > 0 ? apiName : 'Alerta estrutural')

    return { title, iconSlug }
  }
  return null
}

function parseStructuralAlertsFromApi(
  data: unknown,
): StructuralAlertDetailData[] {
  if (!Array.isArray(data)) return []
  const out: StructuralAlertDetailData[] = []

  for (const row of data) {
    if (typeof row !== 'object' || row === null) continue
    const r = row as Record<string, unknown>
    if (typeof r.id !== 'string') continue
    if (typeof r.lat !== 'number' || typeof r.lng !== 'number') continue
    if (!eventListIsStructural(r.events)) continue

    const createdAt = typeof r.createdAt === 'string' ? r.createdAt : undefined
    if (!createdAt) continue

    const primary = parsePrimaryStructuralFromEvents(r.events)
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
    const rank = (x: StructuralAlertDetailData) =>
      x.status === 'ACCEPTED' ? 1 : 0
    const d = rank(a) - rank(b)
    if (d !== 0) return d
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return out
}

export function StructuralAlertPins() {
  const { user } = useUser()
  const { initialState } = useMap()
  const [alerts, setAlerts] = useState<StructuralAlertDetailData[]>([])
  const [selected, setSelected] = useState<StructuralAlertDetailData | null>(
    null,
  )
  const alertsRef = useRef(alerts)

  alertsRef.current = alerts

  const refLat = initialState.latitude ?? user?.lastedLat
  const refLng = initialState.longitude ?? user?.lastedLng

  const load = useCallback(async (): Promise<StructuralAlertDetailData[]> => {
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
      console.warn('[StructuralAlertPins] GET /api/alerts falhou:', res.status)
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

    const parsed = parseStructuralAlertsFromApi(data)
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
    window.addEventListener(STRUCTURAL_ALERTS_REFRESH_EVENT, handler)
    return () =>
      window.removeEventListener(STRUCTURAL_ALERTS_REFRESH_EVENT, handler)
  }, [load])

  useOpenMapAlertDetailListener(alertsRef, load, setSelected)

  useEffect(() => {
    const onCreatedOpen = (e: Event) => {
      const detail = (e as CustomEvent<StructuralAlertCreatedDetailPayload>)
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
      STRUCTURAL_ALERT_CREATED_DETAIL_EVENT,
      onCreatedOpen,
    )
    return () =>
      window.removeEventListener(
        STRUCTURAL_ALERT_CREATED_DETAIL_EVENT,
        onCreatedOpen,
      )
  }, [load])

  const structuralGeoJson = useAlertClusterSource(alerts)

  if (!user?.communities[0]?.communityId) return null

  return (
    <>
      <StructuralAlertDetailDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        alert={selected}
        refLat={refLat}
        refLng={refLng}
      />

      <ClusterLayer
        sourceId="structural-clusters"
        color={CLUSTER_COLORS.structural}
        geojson={structuralGeoJson}
        clusterOffset={CLUSTER_OFFSETS.structural}
      >
        {(showPins) =>
          showPins &&
          alerts.map((alert) => {
            const iconSrc = `${STRUCTURAL_ICON_BASE}/${alert.iconSlug}.svg`
            return (
              <MapMarker
                key={alert.id}
                lat={alert.lat}
                lng={alert.lng}
                anchor="bottom"
              >
                <div className="flex justify-center">
                  <AlertMapPinWithIcon
                    pinSrc={STRUCTURAL_MAP_PIN_SRC}
                    iconSrc={iconSrc}
                    layout="structural"
                    iconScaleOverride={
                      alert.iconSlug === STRUCTURAL_OUTRO_ICON_ID
                        ? 1.3
                        : undefined
                    }
                    aria-label="Ver detalhes do alerta estrutural"
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
