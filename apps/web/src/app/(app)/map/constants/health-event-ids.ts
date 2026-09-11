export const HEALTH_CATEGORY_ID = 'b1b2c3d4-0004-4000-8000-000000000004'

export const HEALTH_ICON_TO_EVENT_ID: Record<string, string> = {
  '2000': 'f0e79a10-0000-4000-8000-000000002020',
  '2001': 'f0e79a10-0000-4000-8000-000000002021',
  '2002': 'f0e79a10-0000-4000-8000-000000002022',
  '2003': 'f0e79a10-0000-4000-8000-000000002023',
  '2004': 'f0e79a10-0000-4000-8000-000000002024',
  '2005': 'f0e79a10-0000-4000-8000-000000002025',
  '2006': 'f0e79a10-0000-4000-8000-000000002026',
  '2007': 'f0e79a10-0000-4000-8000-000000002027',
  '2008': 'f0e79a10-0000-4000-8000-000000002028',
  '2009': 'f0e79a10-0000-4000-8000-000000002029',
  '2010': 'f0e79a10-0000-4000-8000-000000002030',
  '2011': 'f0e79a10-0000-4000-8000-000000002031',
  '2012': 'f0e79a10-0000-4000-8000-000000002032',
  '2013': 'f0e79a10-0000-4000-8000-000000002033',
  '2014': 'f0e79a10-0000-4000-8000-000000002034',
}

export const HEALTH_EVENT_ID_TO_ICON: Record<string, string> =
  Object.fromEntries(
    Object.entries(HEALTH_ICON_TO_EVENT_ID).map(([icon, id]) => [id, icon]),
  )

export function mapHealthIconsToEventIds(icons: Iterable<string>): string[] {
  const ids: string[] = []
  for (const icon of icons) {
    const id = HEALTH_ICON_TO_EVENT_ID[icon]
    if (id) ids.push(id)
  }
  return ids
}
