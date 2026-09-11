import { MAP_ALERT_OPTION_ICON_PX } from './map-alert-option-grid'

export const STRUCTURAL_ICON_BASE = '/categories/structural'
export const STRUCTURAL_CATEGORY_ICON = '1003'
export type StructuralIconLayout = {
  width: number
  height: number
}

export const STRUCTURAL_ICON_LAYOUT: Record<string, StructuralIconLayout> = {
  '6000': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '6001': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '6002': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '6003': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '6004': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '6005': { width: 36, height: 36 },
}

export const DEFAULT_STRUCTURAL_ICON_LAYOUT: StructuralIconLayout = {
  width: MAP_ALERT_OPTION_ICON_PX,
  height: MAP_ALERT_OPTION_ICON_PX,
}

export function getStructuralIconLayout(iconId: string): StructuralIconLayout {
  return STRUCTURAL_ICON_LAYOUT[iconId] ?? DEFAULT_STRUCTURAL_ICON_LAYOUT
}

export type StructuralAlertTypeEntry = {
  icon: string
  label: string
  lines: readonly [string] | readonly [string, string]
  secondLineMuted?: boolean
}

export const STRUCTURAL_ALERT_TYPES: readonly StructuralAlertTypeEntry[] = [
  {
    icon: '6000',
    label: 'Falta de iluminação',
    lines: ['Falta de', 'iluminação'],
  },
  {
    icon: '6001',
    label: 'Falta de saneamento',
    lines: ['Falta de', 'saneamento'],
  },
  {
    icon: '6002',
    label: 'Entulho ou lixo',
    lines: ['Entulho ou', 'lixo'],
    secondLineMuted: true,
  },
  {
    icon: '6003',
    label: 'Ponte danificada',
    lines: ['Ponte', 'danificada'],
  },
  { icon: '6004', label: 'Construção', lines: ['Construção'] },
  { icon: '6005', label: 'Outro', lines: ['Outro'] },
]

export const STRUCTURAL_OUTRO_ICON_ID = '6005'

export const STRUCTURAL_SAFETY_BANNER_LINES = [
  'Problemas de infraestrutura podem piorar com o tempo e afetar o deslocamento.',
  'Evite a área se não for seguro e avise a comunidade.',
] as const
