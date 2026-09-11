export const OPEN_MAP_ALERT_DETAIL_EVENT = 'veracis:open-map-alert-detail'

export const MAP_FLY_TO_COORDINATES_EVENT = 'veracis:map-fly-to-coordinates'

export const PENDING_OPEN_MAP_ALERT_ID_KEY = 'veracis:pending-open-map-alert-id'

export type OpenMapAlertDetailPayload = {
  alertId: string
}

export type MapFlyToCoordinatesPayload = {
  lat: number
  lng: number
}

export function dispatchOpenMapAlertDetail(
  payload: OpenMapAlertDetailPayload,
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<OpenMapAlertDetailPayload>(OPEN_MAP_ALERT_DETAIL_EVENT, {
      detail: payload,
    }),
  )
}

export function dispatchMapFlyToCoordinates(
  payload: MapFlyToCoordinatesPayload,
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<MapFlyToCoordinatesPayload>(MAP_FLY_TO_COORDINATES_EVENT, {
      detail: payload,
    }),
  )
}

export function stashPendingOpenMapAlertId(alertId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PENDING_OPEN_MAP_ALERT_ID_KEY, alertId)
}

export function consumePendingOpenMapAlertId(): string | null {
  if (typeof window === 'undefined') return null
  const id = sessionStorage.getItem(PENDING_OPEN_MAP_ALERT_ID_KEY)
  if (id) sessionStorage.removeItem(PENDING_OPEN_MAP_ALERT_ID_KEY)
  return id
}
