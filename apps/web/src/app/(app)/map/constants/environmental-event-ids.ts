export const ENVIRONMENTAL_CATEGORY_ID = 'b1b2c3d4-0002-4000-8000-000000000002'

export const ENVIRONMENTAL_ICON_TO_EVENT_ID: Record<string, string> = {
  '5000': 'f0e79a10-0000-4000-8000-00000000e000',
  '5001': 'f0e79a10-0000-4000-8000-00000000e001',
  '5002': 'f0e79a10-0000-4000-8000-00000000e002',
  '5003': 'f0e79a10-0000-4000-8000-00000000e003',
  '5004': 'f0e79a10-0000-4000-8000-00000000e004',
  '5005': 'f0e79a10-0000-4000-8000-00000000e005',
  '5007': 'f0e79a10-0000-4000-8000-00000000e006',
}

export const ENVIRONMENTAL_EVENT_ID_TO_ICON: Record<string, string> =
  Object.fromEntries(
    Object.entries(ENVIRONMENTAL_ICON_TO_EVENT_ID).map(([icon, id]) => [
      id,
      icon,
    ]),
  )

export function mapEnvironmentalIconToEventIds(icon: string): string[] {
  const id = ENVIRONMENTAL_ICON_TO_EVENT_ID[icon]
  return id ? [id] : []
}
