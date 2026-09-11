export const STRUCTURAL_CATEGORY_ID = 'b1b2c3d4-0003-4000-8000-000000000003'

export const STRUCTURAL_ICON_TO_EVENT_ID: Record<string, string> = {
  '6000': 'f0e79a10-0000-4000-8000-00000000f000',
  '6001': 'f0e79a10-0000-4000-8000-00000000f001',
  '6002': 'f0e79a10-0000-4000-8000-00000000f002',
  '6003': 'f0e79a10-0000-4000-8000-00000000f003',
  '6004': 'f0e79a10-0000-4000-8000-00000000f004',
  '6005': 'f0e79a10-0000-4000-8000-00000000f005',
}

export const STRUCTURAL_EVENT_ID_TO_ICON: Record<string, string> =
  Object.fromEntries(
    Object.entries(STRUCTURAL_ICON_TO_EVENT_ID).map(([icon, id]) => [id, icon]),
  )

export function mapStructuralIconToEventIds(icon: string): string[] {
  const id = STRUCTURAL_ICON_TO_EVENT_ID[icon]
  return id ? [id] : []
}
