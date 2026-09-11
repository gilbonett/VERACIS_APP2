export const HEALTH_ALERTS_REFRESH_EVENT = 'veracis:health-alerts-refresh'

export const CLIMATIC_ALERTS_REFRESH_EVENT = 'veracis:climatic-alerts-refresh'

export const CLIMATIC_ALERT_CREATED_DETAIL_EVENT =
  'veracis:climatic-alert-created-detail'

export type ClimaticAlertCreatedDetailPayload = {
  alertId: string
}

export function requestHealthAlertsRefresh(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(HEALTH_ALERTS_REFRESH_EVENT))
}

export function requestClimaticAlertsRefresh(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CLIMATIC_ALERTS_REFRESH_EVENT))
}

export function dispatchClimaticAlertCreatedDetail(
  payload: ClimaticAlertCreatedDetailPayload,
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ClimaticAlertCreatedDetailPayload>(
      CLIMATIC_ALERT_CREATED_DETAIL_EVENT,
      { detail: payload },
    ),
  )
}

export const ENVIRONMENTAL_ALERTS_REFRESH_EVENT =
  'veracis:environmental-alerts-refresh'

export const ENVIRONMENTAL_ALERT_CREATED_DETAIL_EVENT =
  'veracis:environmental-alert-created-detail'

export type EnvironmentalAlertCreatedDetailPayload = {
  alertId: string
}

export function requestEnvironmentalAlertsRefresh(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(ENVIRONMENTAL_ALERTS_REFRESH_EVENT))
}

export function dispatchEnvironmentalAlertCreatedDetail(
  payload: EnvironmentalAlertCreatedDetailPayload,
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<EnvironmentalAlertCreatedDetailPayload>(
      ENVIRONMENTAL_ALERT_CREATED_DETAIL_EVENT,
      { detail: payload },
    ),
  )
}

export const STRUCTURAL_ALERTS_REFRESH_EVENT =
  'veracis:structural-alerts-refresh'

export const STRUCTURAL_ALERT_CREATED_DETAIL_EVENT =
  'veracis:structural-alert-created-detail'

export type StructuralAlertCreatedDetailPayload = {
  alertId: string
}

export function requestStructuralAlertsRefresh(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(STRUCTURAL_ALERTS_REFRESH_EVENT))
}

export function dispatchStructuralAlertCreatedDetail(
  payload: StructuralAlertCreatedDetailPayload,
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<StructuralAlertCreatedDetailPayload>(
      STRUCTURAL_ALERT_CREATED_DETAIL_EVENT,
      { detail: payload },
    ),
  )
}
