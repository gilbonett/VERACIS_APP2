export const RISK_ICON_TO_EVENT_ID: Record<string, string> = {
  '5000': 'f0e79a10-0000-4000-8000-000000005000',
  '5001': 'f0e79a10-0000-4000-8000-000000005001',
  '5002': 'f0e79a10-0000-4000-8000-000000005002',
  '5003': 'f0e79a10-0000-4000-8000-000000005003',
  '5004': 'f0e79a10-0000-4000-8000-000000005004',
  '5005': 'f0e79a10-0000-4000-8000-000000005005',
}

export function mapRiskIconsToEventIds(icons: string[]): string[] {
  return icons
    .map((icon) => RISK_ICON_TO_EVENT_ID[icon])
    .filter((id): id is string => Boolean(id))
}
