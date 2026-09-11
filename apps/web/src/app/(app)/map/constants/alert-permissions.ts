type AuthLikeUser = { id?: string } | null | undefined

export function isAuthenticatedUser(user: AuthLikeUser): boolean {
  return Boolean(user?.id)
}

export function canCreateAlerts(user: AuthLikeUser): boolean {
  return isAuthenticatedUser(user)
}

export function canCommentAlerts(user: AuthLikeUser): boolean {
  return isAuthenticatedUser(user)
}

export function canValidateAlerts(user: AuthLikeUser): boolean {
  return isAuthenticatedUser(user)
}
