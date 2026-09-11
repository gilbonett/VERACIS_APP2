export const CLUSTER_RADIUS = 50
export const CLUSTER_MAX_ZOOM = 14

export const CLUSTER_COLORS = {
  health: '#C4DBE8',
  climatic: '#FFC86A',
  environmental: '#8AEEDE',
  structural: '#FFB3B3',
} as const

export const CLUSTER_OFFSETS: Record<
  keyof typeof CLUSTER_COLORS,
  [number, number]
> = {
  health: [0, -28],
  climatic: [28, 0],
  environmental: [0, 28],
  structural: [-28, 0],
} as const
