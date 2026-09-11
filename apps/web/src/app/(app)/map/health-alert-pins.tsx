'use client'

import { MapMarker, useMap } from '@/components/map'
import { useUser } from '@/contexts/user-context'
import { getPrimaryCommunity } from '@/utils/user-community'
import type { UserRole } from '@/utils/user-roles'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  HealthAlertDetailDialog,
  type HealthAlertDetailData,
} from './(dialogs)/health-alert-detail-dialog'
import { buildAlertsListSearchParams } from './constants/alert-list-query'
import {
  getHealthAlertFinalizeState,
  markHealthAlertFinalizePending,
} from './constants/health-alert-finalize-local'
import { HEALTH_ALERTS_REFRESH_EVENT } from './constants/health-alerts-refresh'
import { canViewHealthAlertOnMap } from './constants/health-alert-visibility'
import {
  HEALTH_CATEGORY_ID,
  HEALTH_EVENT_ID_TO_ICON,
} from './constants/health-event-ids'
import {
  HEALTH_MAP_PIN_ICON,
  HEALTH_PAINS,
  HEALTH_SYMPTOMS,
  normalizeHealthIconSlug,
} from './constants/health-symptoms'
import {
  MAP_ALERT_PIN_DISPLAY_HEIGHT_PX,
  MAP_ALERT_PIN_DISPLAY_WIDTH_PX,
} from './constants/map-alert-pin-display'
import { LAYOUT } from './alert-map-pin-with-icon'
import { HealthFinalizedMapPin } from './health-finalized-map-pin'
import { useOpenMapAlertDetailListener } from './hooks/use-open-map-alert-detail-listener'
import { ClusterLayer } from './cluster-layer'
import { useAlertClusterSource } from './hooks/use-alert-cluster-source'
import { CLUSTER_COLORS, CLUSTER_OFFSETS } from './constants/cluster-config'

const HEALTH_LABEL_BY_ICON = new Map<string, string>([
  ...HEALTH_SYMPTOMS.map((i) => [i.icon, i.label] as const),
  ...HEALTH_PAINS.map((i) => [i.icon, i.label] as const),
])

function eventListIsHealth(events: unknown): boolean {
  if (!Array.isArray(events)) return false
  return events.some(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      'categoryId' in e &&
      typeof (e as { categoryId: string }).categoryId === 'string' &&
      (e as { categoryId: string }).categoryId === HEALTH_CATEGORY_ID,
  )
}

function parseSymptomsFromAlertEvents(
  events: unknown,
): HealthAlertDetailData['symptoms'] {
  if (!Array.isArray(events)) return []
  const seen = new Set<string>()
  const items: HealthAlertDetailData['symptoms'] = []

  for (const raw of events) {
    if (typeof raw !== 'object' || raw === null) continue
    const ev = raw as Record<string, unknown>
    if (ev.categoryId !== HEALTH_CATEGORY_ID) continue

    const eventId = typeof ev.eventId === 'string' ? ev.eventId : ''
    if (!eventId || seen.has(eventId)) continue

    const fromApiIcon =
      typeof ev.eventIcon === 'string' && ev.eventIcon.trim()
        ? ev.eventIcon.trim()
        : ''
    const iconSlug = normalizeHealthIconSlug(
      fromApiIcon || HEALTH_EVENT_ID_TO_ICON[eventId] || '',
    )
    if (!iconSlug) continue

    seen.add(eventId)

    const apiName = typeof ev.eventName === 'string' ? ev.eventName.trim() : ''
    const label =
      HEALTH_LABEL_BY_ICON.get(iconSlug) ||
      (apiName.length > 0 ? apiName : 'Sintoma')

    items.push({ eventId, iconSlug, label })
  }

  return items
}

function parseHealthAlertsFromApi(
  data: unknown,
  currentUserId: string | undefined,
  currentUserRole: UserRole | undefined,
): HealthAlertDetailData[] {
  if (!Array.isArray(data)) return []
  const out: HealthAlertDetailData[] = []

  for (const row of data) {
    if (typeof row !== 'object' || row === null) continue
    const r = row as Record<string, unknown>
    if (typeof r.id !== 'string') continue
    if (typeof r.lat !== 'number' || typeof r.lng !== 'number') continue
    if (!eventListIsHealth(r.events)) continue

    const authorId = typeof r.authorId === 'string' ? r.authorId : undefined
    if (
      !canViewHealthAlertOnMap(
        { authorId, events: r.events },
        currentUserId,
        currentUserRole,
      )
    ) {
      continue
    }

    const createdAt = typeof r.createdAt === 'string' ? r.createdAt : undefined
    if (!createdAt) continue

    const commentsCount =
      typeof r.commentsCount === 'number' ? r.commentsCount : 0
    const description =
      typeof r.description === 'string'
        ? r.description
        : r.description === null
          ? null
          : undefined

    const symptoms = parseSymptomsFromAlertEvents(r.events)

    const pendingClosure =
      r.pendingClosure === true ||
      r.finalizationQueued === true ||
      r.closed === true

    out.push({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      createdAt,
      description,
      commentsCount,
      symptoms,
      pendingClosure,
    })
  }

  return out
}

export function HealthAlertPins() {
  const { user } = useUser()
  const { initialState } = useMap()
  const [alerts, setAlerts] = useState<HealthAlertDetailData[]>([])
  const [selected, setSelected] = useState<HealthAlertDetailData | null>(null)
  const [finalizeTick, setFinalizeTick] = useState(0)
  const alertsRef = useRef(alerts)

  alertsRef.current = alerts

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFinalizeTick((t) => t + 1)
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const finalizeState = useMemo(
    () => getHealthAlertFinalizeState(),
    [finalizeTick, alerts],
  )
  const finalizePendingIds = finalizeState.pendingIds
  const finalizeHiddenIds = finalizeState.hiddenIds

  const alertsWithClosure = useMemo(
    () =>
      alerts
        .filter((a) => !finalizeHiddenIds.has(a.id))
        .map((a) => ({
          ...a,
          pendingClosure: a.pendingClosure || finalizePendingIds.has(a.id),
        })),
    [alerts, finalizeHiddenIds, finalizePendingIds],
  )

  const refLat = initialState.latitude ?? user?.lastedLat
  const refLng = initialState.longitude ?? user?.lastedLng

  const primaryCommunity = getPrimaryCommunity(user)

  const load = useCallback(async (): Promise<HealthAlertDetailData[]> => {
    if (!primaryCommunity?.communityId) {
      setAlerts([])
      return []
    }

    const params = buildAlertsListSearchParams(primaryCommunity.communityId)
    const res = await fetch(`/api/alerts?${params.toString()}`, {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!res.ok) {
      console.warn('[HealthAlertPins] GET /api/alerts falhou:', res.status)
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

    const parsed = parseHealthAlertsFromApi(data, user?.id, user?.role)
    setAlerts(parsed)
    return parsed
  }, [primaryCommunity?.communityId, user?.id, user?.role])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const handler = () => {
      void load()
    }
    window.addEventListener(HEALTH_ALERTS_REFRESH_EVENT, handler)
    return () =>
      window.removeEventListener(HEALTH_ALERTS_REFRESH_EVENT, handler)
  }, [load])

  useOpenMapAlertDetailListener(alertsRef, load, setSelected)

  const healthGeoJson = useAlertClusterSource(alertsWithClosure)

  if (!primaryCommunity?.communityId) return null

  return (
    <>
      <HealthAlertDetailDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        alert={selected}
        refLat={refLat}
        refLng={refLng}
        onFinalized={(alertId) => {
          markHealthAlertFinalizePending(alertId)
          setFinalizeTick((t) => t + 1)
          void load()
          setSelected(null)
        }}
      />

      <ClusterLayer
        sourceId="health-clusters"
        color={CLUSTER_COLORS.health}
        geojson={healthGeoJson}
        clusterOffset={CLUSTER_OFFSETS.health}
      >
        {(showPins) =>
          showPins &&
          alertsWithClosure.map((alert) => (
            <MapMarker
              key={alert.id}
              lat={alert.lat}
              lng={alert.lng}
              anchor="bottom"
            >
              <div className="flex justify-center">
                <button
                  type="button"
                  aria-label={
                    alert.pendingClosure
                      ? 'Alerta de saúde — alerta encerrado'
                      : 'Ver detalhes do alerta de saúde'
                  }
                  className="flex cursor-pointer justify-center rounded-none border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4] focus-visible:ring-offset-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected(alert)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {alert.pendingClosure ? (
                    <HealthFinalizedMapPin />
                  ) : (
                    <img
                      src={`/assets/pin/${HEALTH_MAP_PIN_ICON}.svg`}
                      alt=""
                      style={{
                        width: MAP_ALERT_PIN_DISPLAY_WIDTH_PX * LAYOUT.health.pinScale,
                        height: MAP_ALERT_PIN_DISPLAY_HEIGHT_PX * LAYOUT.health.pinScale,
                      }}
                      className="pointer-events-none block max-w-none select-none opacity-100"
                    />
                  )}
                </button>
              </div>
            </MapMarker>
          ))
        }
      </ClusterLayer>
    </>
  )
}
