import { MAP_ALERT_OPTION_ICON_PX } from './map-alert-option-grid'

export const ENVIRONMENTAL_ICON_BASE = '/categories/environmental'
export const ENVIRONMENTAL_CATEGORY_ICON = '1002'
export type EnvironmentalIconLayout = {
  width: number
  height: number
}

export const ENVIRONMENTAL_ICON_LAYOUT: Record<
  string,
  EnvironmentalIconLayout
> = {
  '5000': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '5001': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '5002': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '5003': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '5004': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '5005': { width: MAP_ALERT_OPTION_ICON_PX, height: MAP_ALERT_OPTION_ICON_PX },
  '5007': { width: 36, height: 36 },
}

export const DEFAULT_ENVIRONMENTAL_ICON_LAYOUT: EnvironmentalIconLayout = {
  width: MAP_ALERT_OPTION_ICON_PX,
  height: MAP_ALERT_OPTION_ICON_PX,
}

export function getEnvironmentalIconLayout(
  iconId: string,
): EnvironmentalIconLayout {
  return ENVIRONMENTAL_ICON_LAYOUT[iconId] ?? DEFAULT_ENVIRONMENTAL_ICON_LAYOUT
}

export type EnvironmentalAlertTypeEntry = {
  icon: string
  label: string
  lines: readonly [string] | readonly [string, string]
  secondLineMuted?: boolean
}

export const ENVIRONMENTAL_ALERT_TYPES: readonly EnvironmentalAlertTypeEntry[] =
  [
    { icon: '5000', label: 'Morte de Animais', lines: ['Morte de', 'Animais'] },
    {
      icon: '5001',
      label: 'Redução de caça',
      lines: ['Redução', 'de caça'],
    },
    {
      icon: '5002',
      label: 'Redução de pesca',
      lines: ['Redução', 'de pesca'],
    },
    {
      icon: '5003',
      label: 'Ataque de animais',
      lines: ['Ataque de', 'animais'],
    },
    {
      icon: '5004',
      label: 'Incêndio florestal',
      lines: ['Incêndio', 'florestal'],
    },
    { icon: '5005', label: 'Desmatamento', lines: ['Desmatamento'] },
    { icon: '5007', label: 'Outro', lines: ['Outro'] },
  ]

export const ENVIRONMENTAL_OUTRO_ICON_ID = '5007'

export const ENVIRONMENTAL_SAFETY_BANNER_LINES = [
  'Situações ambientais podem evoluir rapidamente e afetar a segurança.',
  'Evite a área e fique em local seguro.',
] as const
