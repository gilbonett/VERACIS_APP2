export const CLIMATIC_ICON_BASE = '/categories/climatic'

const ICON_PNG_OVERRIDES = new Set(['4011'])
export const climaticIconSrc = (slug: string) =>
  `${CLIMATIC_ICON_BASE}/${slug}.${ICON_PNG_OVERRIDES.has(slug) ? 'png' : 'svg'}`

export const CLIMATIC_CATEGORY_ICON = '1001'
export const MAP_REACTION_ICON_BASE = '/categories/map'
export const MAP_LIKE_REACTION_ICON = 'like'
export const MAP_DISLIKE_REACTION_ICON = 'dislike'
export const CLIMATIC_COMMUNITY_DISLIKE_ICON_ID = '4018'
export const CLIMATIC_COMMUNITY_DISLIKE_BANNER_ICON_ID = '4016'
export const CLIMATIC_COMMUNITY_LIKE_ICON_ID = '4017'
export const CLIMATIC_OUTRO_ICON_ID = '4014'

export type ClimaticIconLayout = {
  width: number
  height: number
}

export const CLIMATIC_ICON_LAYOUT: Record<string, ClimaticIconLayout> = {
  '4000': { width: 50, height: 40 },
  '4001': { width: 53, height: 50 },
  '4002': { width: 48.00011444091797, height: 47.984127044677734 },
  '4003': { width: 48.99929428100586, height: 48.9990119934082 },
  '4004': { width: 48.00014877319336, height: 48.00243377685547 },
  '4005': { width: 36.999671936035156, height: 42.71818923950195 },
  '4006': { width: 48.48634338378906, height: 38.99964141845703 },
  '4007': { width: 44, height: 44 },
  '4008': { width: 43, height: 43 },
  '4009': { width: 47, height: 44 },
  '4010': { width: 34.11528015136719, height: 48.97016143798828 },
  '4011': { width: 47, height: 47 },
  '4012': { width: 45.646949768066406, height: 43.000030517578125 },
  '4013': { width: 47, height: 47 },
  '4014': { width: 36, height: 36 },
  '4015': { width: 10, height: 6 },
  '4016': { width: 21, height: 21 },
  '4017': { width: 21, height: 21 },
}

export const DEFAULT_CLIMATIC_ICON_LAYOUT: ClimaticIconLayout = {
  width: 48,
  height: 48,
}

export function getClimaticIconLayout(iconId: string): ClimaticIconLayout {
  return CLIMATIC_ICON_LAYOUT[iconId] ?? DEFAULT_CLIMATIC_ICON_LAYOUT
}

export type ClimaticAlertTypeEntry = {
  icon: string
  label: string
  lines: readonly [string] | readonly [string, string]
  secondLineMuted?: boolean
}

export const CLIMATIC_ALERT_TYPES: readonly ClimaticAlertTypeEntry[] = [
  { icon: '4000', label: 'Vento Forte', lines: ['Vento', 'Forte'] },
  { icon: '4001', label: 'Chuva Forte', lines: ['Chuva', 'Forte'] },
  { icon: '4002', label: 'Tempestade Severa', lines: ['Tempestade', 'Severa'] },
  {
    icon: '4003',
    label: 'Granizo (Pedras de Gelo)',
    lines: ['Granizo', '(Pedras de Gelo)'],
    secondLineMuted: true,
  },
  { icon: '4004', label: 'Raios e Trovões', lines: ['Raios', 'e Trovões'] },
  {
    icon: '4005',
    label: 'Tornado ou Furacão',
    lines: ['Tornado', 'ou Furacão'],
  },
  {
    icon: '4006',
    label: 'Mar Agitado (Ressaca)',
    lines: ['Mar Agitado', '( Ressaca )'],
    secondLineMuted: true,
  },
  { icon: '4007', label: 'Frio Intenso', lines: ['Frio', 'Intenso'] },
  { icon: '4008', label: 'Calor Intenso', lines: ['Calor', 'Intenso'] },
  { icon: '4009', label: 'Seca ou Estiagem', lines: ['Seca', 'ou Estiagem'] },
  { icon: '4010', label: 'Incêndio', lines: ['Incêndio'] },
  { icon: '4011', label: 'Fumaça', lines: ['Fumaça'] },
  { icon: '4012', label: 'Ar Seco', lines: ['Ar Seco'] },
  { icon: '4013', label: 'Árvore Caída', lines: ['Árvore', 'Caída'] },
  { icon: '4014', label: 'Outro', lines: ['Outro'] },
]
