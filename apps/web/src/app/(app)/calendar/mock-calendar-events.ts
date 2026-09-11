export type MockCalendarEvent = {
  id: string
  isoDate: string
  title: string
  timeLabel: string
  communityId: string
  communityName: string
  kind: 'reuniao' | 'oficina' | 'acao'
}

const TITLE_POOL: Record<MockCalendarEvent['kind'], string[]> = {
  reuniao: [
    'Reunião de planejamento comunitário',
    'Assembleia de prioridades',
    'Encontro com lideranças locais',
  ],
  oficina: [
    'Oficina de primeiros socorros',
    'Capacitação em riscos ambientais',
    'Oficina de mapeamento participativo',
  ],
  acao: [
    'Mutirão de limpeza',
    'Plantio participativo',
    'Ação de vigilância em saúde',
  ],
}

const KIND_ROTATION: MockCalendarEvent['kind'][] = [
  'reuniao',
  'oficina',
  'acao',
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function buildMockEventsForMonth(
  year: number,
  monthIndex: number,
  communities: readonly { communityId: string; communityName: string }[],
): MockCalendarEvent[] {
  const fallback = [
    {
      communityId: 'demo-veracis',
      communityName: 'Comunidade (demonstração)',
    },
  ]
  const list = communities.length > 0 ? [...communities] : fallback

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const pickDay = (seed: number) => {
    const base = 3 + (seed % 11)
    return Math.min(Math.max(base, 1), daysInMonth)
  }

  const out: MockCalendarEvent[] = []
  let t = 0

  for (let ci = 0; ci < list.length; ci++) {
    const c = list[ci]
    const dayOffsets = [0, 1, 2].map((k) => pickDay(ci * 7 + k * 5 + t++))

    for (let j = 0; j < 3; j++) {
      const day = dayOffsets[j]
      const isoDate = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
      const kind = KIND_ROTATION[(ci + j) % KIND_ROTATION.length]
      const titles = TITLE_POOL[kind]
      const title = titles[(ci + j) % titles.length]
      const hour = 8 + ((ci * 3 + j) % 8)

      out.push({
        id: `${c.communityId}-${isoDate}-${j}`,
        isoDate,
        title,
        timeLabel: `${pad2(hour)}:${j === 1 ? '30' : '00'}`,
        communityId: c.communityId,
        communityName: c.communityName,
        kind,
      })
    }
  }

  return out.sort((a, b) => {
    const cmp = a.isoDate.localeCompare(b.isoDate)
    if (cmp !== 0) return cmp
    return a.timeLabel.localeCompare(b.timeLabel)
  })
}

export function toIsoDateLocal(year: number, monthIndex: number, day: number) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}
