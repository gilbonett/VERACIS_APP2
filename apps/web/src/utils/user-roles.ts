export const USER_ROLES = ['MEMBER', 'LEADER', 'MANAGER', 'ROOT'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: 'Membro comunitário',
  LEADER: 'Líder comunitário',
  MANAGER: 'Gestor',
  ROOT: 'Administrador',
}
