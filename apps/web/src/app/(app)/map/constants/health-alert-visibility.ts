import type { UserRole } from '@/utils/user-roles'
import { HEALTH_CATEGORY_ID } from './health-event-ids'

type AlertRow = {
  authorId?: string
  events?: unknown
}

export function alertEventsIncludeHealthCategory(events: unknown): boolean {
  if (!Array.isArray(events)) return false
  return events.some(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      'categoryId' in e &&
      (e as { categoryId: string }).categoryId === HEALTH_CATEGORY_ID,
  )
}

export function canViewHealthAlertOnMap(
  alert: AlertRow,
  currentUserId: string | undefined,
  currentUserRole: UserRole | undefined,
): boolean {
  if (!alertEventsIncludeHealthCategory(alert.events)) {
    return true
  }

  if (!currentUserId || !currentUserRole) {
    return false
  }

  if (alert.authorId === currentUserId) {
    return true
  }

  if (currentUserRole === 'LEADER') {
    return true
  }

  if (currentUserRole === 'MANAGER' || currentUserRole === 'ROOT') {
    return true
  }

  return false
}
