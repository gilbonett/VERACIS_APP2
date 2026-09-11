export const HEALTH_SYMPTOMS = [
  { icon: '2000', label: 'Febre' },
  { icon: '2001', label: 'Calafrios' },
  { icon: '2002', label: 'Fraqueza' },
  { icon: '2003', label: 'Diarréia' },
  { icon: '2004', label: 'Enjôo' },
  { icon: '2005', label: 'Vômito' },
  { icon: '2006', label: 'Tontura' },
  { icon: '2007', label: 'Tosse' },
  { icon: '2008', label: 'Convulsão' },
  { icon: '2009', label: 'Desmaio' },
] as const

export const HEALTH_PAINS = [
  { icon: '2010', label: 'no corpo' },
  { icon: '2011', label: 'na cabeça' },
  { icon: '2012', label: 'na garganta' },
  { icon: '2013', label: 'na barriga' },
  { icon: '2014', label: 'Musculares' },
] as const

export const EMERGENCY_WARNING_ICON = '/categories/health/2015.svg'

export const HEALTH_ICON_BASE = '/categories/health'

const LEGACY_HEALTH_ICON_SLUG_MAP: Record<string, string> = {
  '2020': '2000',
  '2021': '2001',
  '2022': '2002',
  '2023': '2003',
  '2024': '2004',
  '2025': '2005',
  '2026': '2006',
  '2027': '2007',
  '2028': '2008',
  '2029': '2009',
  '2030': '2010',
  '2031': '2011',
  '2032': '2012',
  '2033': '2013',
  '2034': '2014',
  '2035': '2015',
  '2036': '2016',
  '2037': '2017',
  '2038': '2018',
}

export function normalizeHealthIconSlug(iconSlug: string): string {
  const trimmed = iconSlug.trim()
  if (!trimmed) return ''

  const filename = trimmed.split('/').pop() ?? trimmed
  const slug = filename.replace(/\.svg$/i, '')

  return LEGACY_HEALTH_ICON_SLUG_MAP[slug] ?? slug
}

export const HEALTH_CATEGORY_ICON = '1000'

export const HEALTH_MAP_PIN_ICON = '1030'

export const HEALTH_MAP_PIN_FINALIZED_GIF_SRC = '/categories/1011.gif'

export const HEALTH_MAP_PIN_FINALIZED_SVG_SRC = '/categories/1010.svg'

export const HEALTH_COMMENTS_BADGE_ICON = '2016'

export const HEALTH_COMMENT_SEND_ICON = '2017'

export const HEALTH_COMMENTS_CHEVRON_ICON = '2018'

export const HEALTH_COMMENTS_SECTION_ICON = '2019'

export const EMERGENCY_CONTACTS = [
  {
    id: 'policia-civil',
    name: 'Polícia Civil',
    phone: '190',
    phoneHref: 'tel:190',
    icon: '/categories/emergency/3000.svg',
  },
  {
    id: 'prf',
    name: 'Polícia Rodoviária Federal (PRF)',
    phone: '191',
    phoneHref: 'tel:191',
    icon: '/categories/emergency/3001.svg',
  },
  {
    id: 'samu',
    name: 'SAMU',
    phone: '192',
    phoneHref: 'tel:192',
    icon: '/categories/emergency/3002.svg',
  },
  {
    id: 'bombeiros',
    name: 'Bombeiros',
    phone: '193',
    phoneHref: 'tel:193',
    icon: '/categories/emergency/3003.svg',
  },
  {
    id: 'ibama',
    name: 'Denúncias ambientais (IBAMA)',
    phone: '0800 618080 / 181',
    phoneHref: 'tel:0800618080',
    icon: '/categories/emergency/3004.svg',
  },
] as const

export const EMERGENCY_PHONE_ICON = '/categories/emergency/3005.svg'
