import { RISK_ICON_TO_API_RISK_NAME } from './risk-events'

export type ApiRiskRow = {
  id: string
  name: string
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

export function mapRiskIconSelectionToRiskIds(
  selectedIcons: string[],
  risks: ApiRiskRow[],
): string[] {
  const byName = new Map<string, string>()
  for (const r of risks) {
    byName.set(norm(r.name), r.id)
  }

  const out: string[] = []
  for (const icon of selectedIcons) {
    const apiName = RISK_ICON_TO_API_RISK_NAME[icon]
    if (!apiName) continue
    const id = byName.get(norm(apiName))
    if (id) out.push(id)
  }
  return [...new Set(out)]
}
