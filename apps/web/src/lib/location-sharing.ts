export const LOCATION_SHARING_ENABLED_KEY = 'veracis.locationSharing.enabled'
export const LOCATION_SHARING_DISABLED_KEY = 'veracis.locationSharing.disabled'
export const LOCATION_SHARING_LAST_COORDS_KEY = 'veracis.locationSharing.lastCoords'
export const LOCATION_SHARING_USER_ID_KEY = 'veracis.locationSharing.userId'
export const LOCATION_SHARING_CHANGED_EVENT =
  'veracis:location-sharing-changed'

export type StoredSharedLocation = {
  latitude: number
  longitude: number
  updatedAt: number
}

export function getStoredLocationSharingEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(LOCATION_SHARING_ENABLED_KEY) === 'true'
}

export function setStoredLocationSharingEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCATION_SHARING_ENABLED_KEY, String(enabled))
}

export function getStoredLocationSharingDisabled(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(LOCATION_SHARING_DISABLED_KEY) === 'true'
}

export function setStoredLocationSharingDisabled(disabled: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCATION_SHARING_DISABLED_KEY, String(disabled))
}

export function getStoredLocationSharingUserId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(LOCATION_SHARING_USER_ID_KEY)
}

export function setStoredLocationSharingUserId(userId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCATION_SHARING_USER_ID_KEY, userId)
}

export function getStoredSharedLocation(): StoredSharedLocation | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(LOCATION_SHARING_LAST_COORDS_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSharedLocation>
    if (
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null
    }
    return parsed as StoredSharedLocation
  } catch {
    return null
  }
}

export function setStoredSharedLocation(location: StoredSharedLocation) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    LOCATION_SHARING_LAST_COORDS_KEY,
    JSON.stringify(location),
  )
}

export function emitLocationSharingChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(LOCATION_SHARING_CHANGED_EVENT))
}
