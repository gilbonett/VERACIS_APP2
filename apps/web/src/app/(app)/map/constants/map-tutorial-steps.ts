export type MapTutorialStepPlacement = 'top' | 'bottom' | 'left' | 'right'

export type MapTutorialStep = {
  id: string
  target: string
  title?: string
  description: string
  placement?: MapTutorialStepPlacement
  showStepBadge?: boolean
  showTitleSeparator?: boolean
  handPointerSrc?: string
  balloonHorizontalOffsetPx?: number
  arrowOffsetPercent?: number
  centerBalloonOnScreen?: boolean
  descriptionAlign?: 'center' | 'left'
}

export const MAP_TUTORIAL_STEPS: MapTutorialStep[] = [
  {
    id: 'create-alert',
    target: '[data-tour="map-canvas"]',
    description: 'Para criar um alerta clique em qualquer área do mapa',
    placement: 'top',
    showStepBadge: true,
    handPointerSrc: '/assets/tutorial/img-007.svg',
  },
  {
    id: 'map-controls',
    target: '[data-tour-control]',
    title: 'Controles de mapa',
    description:
      'Você pode navegar no mapa com os diferentes modos de controle',
    placement: 'left',
    showStepBadge: true,
    showTitleSeparator: true,
  },
  {
    id: 'validated-alerts',
    target: '[data-tour="validated-alert-example"]',
    title: 'Alertas Validados pela comunidade',
    description:
      'São alertas confiáveis pois foram confirmados por outros usuários.',
    placement: 'top',
    showStepBadge: true,
    showTitleSeparator: true,
    centerBalloonOnScreen: true,
  },
  // {
  //   id: 'pending-alerts',
  //   target: '[data-tour="pending-alert-example"]',
  //   title: 'Alertas não validados',
  //   description:
  //     'São alertas criados aguardando\nvalidação de outros usuários.',
  //   placement: 'top',
  //   showStepBadge: true,
  //   showTitleSeparator: true,
  //   centerBalloonOnScreen: true,
  //   arrowOffsetPercent: 6,
  //   descriptionAlign: 'left',
  // },
]

export const MAP_TUTORIAL_STEP_COUNT = MAP_TUTORIAL_STEPS.length
