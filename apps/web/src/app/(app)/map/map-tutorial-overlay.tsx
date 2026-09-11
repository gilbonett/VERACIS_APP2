'use client'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import type { MapTutorialStep } from './constants/map-tutorial-steps'
import { MAP_TUTORIAL_STEP_COUNT } from './constants/map-tutorial-steps'
import { TutorialPendingPinMarker } from './tutorial-pending-pin-marker'
import { TutorialValidatedPinMarker } from './tutorial-validated-pin-marker'

type Rect = {
  top: number
  left: number
  width: number
  height: number
}

type MapTutorialOverlayProps = {
  step: MapTutorialStep
  stepIndex: number
  onNext: () => void
}

const VIEWPORT_MARGIN = 16
const OVERLAY_SCRIM = 'rgba(0, 0, 0, 0.55)'
const BALLOON_MAX_WIDTH = 320
const TITLED_BALLOON_CONTENT_WIDTH = 294
const TITLED_BALLOON_MIN_WIDTH = 362
const TITLED_BALLOON_MIN_WIDTH_MOBILE = 300
const MAP_CONTROLS_MOBILE_GAP_BELOW_CONTROLS_PX = 8
const CONTROL_HOLE_PADDING_PX = 3

function getTitledBalloonWidth(
  viewportW: number,
  isMobile: boolean,
  options?: { fullWidthOnMobile?: boolean },
) {
  const max = viewportW - VIEWPORT_MARGIN * 2
  if (isMobile && options?.fullWidthOnMobile) {
    return max
  }
  const preferred = isMobile
    ? Math.min(TITLED_BALLOON_MIN_WIDTH_MOBILE, max)
    : Math.min(TITLED_BALLOON_MIN_WIDTH, max)
  return preferred
}

type ControlHole = Rect & { borderRadius: number }

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function getMapCanvasRect(): Rect | null {
  return getTargetRect('[data-tour="map-canvas"]')
}

function getMapCanvasCenterX(): number | null {
  const rect = getMapCanvasRect()
  if (!rect) return null
  return rect.left + rect.width / 2
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getTopPlacementArrowLeftPercent(
  targetCenterX: number,
  balloonCenterX: number,
  balloonWidth: number,
  arrowOffsetPercent = 0,
) {
  const balloonLeft = balloonCenterX - balloonWidth / 2

  return clamp(
    ((targetCenterX - balloonLeft) / balloonWidth) * 100 + arrowOffsetPercent,
    12,
    92,
  )
}

function unionRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) {
    return null
  }

  const top = Math.min(...rects.map((rect) => rect.top))
  const left = Math.min(...rects.map((rect) => rect.left))
  const right = Math.max(...rects.map((rect) => rect.left + rect.width))
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height))

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  }
}

function getMapControlHighlightHoles(): ControlHole[] {
  const nodes = document.querySelectorAll('[data-tour-control]')
  const holes: ControlHole[] = []

  nodes.forEach((node) => {
    const rect = node.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) {
      return
    }

    const padding = CONTROL_HOLE_PADDING_PX
    const width = rect.width + padding * 2
    const height = rect.height + padding * 2
    const controlType = node.getAttribute('data-tour-control')
    const borderRadius =
      controlType === 'zoom'
        ? width / 2
        : Math.min(width, height) / 2

    holes.push({
      top: rect.top - padding,
      left: rect.left - padding,
      width,
      height,
      borderRadius,
    })
  })

  return holes
}

function ScrimWithControlHoles({
  holes,
  scrimColor,
  onScrimClick,
}: {
  holes: ControlHole[]
  scrimColor: string
  onScrimClick?: () => void
}) {
  const maskId = useId()
  const viewportW =
    typeof window !== 'undefined' ? window.innerWidth : 0
  const viewportH =
    typeof window !== 'undefined' ? window.innerHeight : 0

  return (
    <svg
      className={cn(
        'absolute inset-0 z-0 h-full w-full',
        onScrimClick ? 'pointer-events-auto cursor-default' : 'pointer-events-none',
      )}
      width={viewportW}
      height={viewportH}
      aria-hidden={!onScrimClick}
      {...(onScrimClick
        ? {
            role: 'button' as const,
            tabIndex: -1,
            onClick: onScrimClick,
            onKeyDown: (event: KeyboardEvent<SVGSVGElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                onScrimClick()
              }
            },
          }
        : {})}
    >
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          {holes.map((hole, index) => (
            <rect
              key={index}
              x={hole.left}
              y={hole.top}
              width={hole.width}
              height={hole.height}
              rx={hole.borderRadius}
              ry={hole.borderRadius}
              fill="black"
            />
          ))}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={scrimColor} mask={`url(#${maskId})`} />
    </svg>
  )
}

function MapTutorialTitledCardBalloon({
  step,
  stepIndex,
  style,
  arrowClassName,
  arrowStyle,
  largeOnMobile = false,
  mapAlignedOnMobile = false,
}: {
  step: MapTutorialStep
  stepIndex: number
  style: CSSProperties
  arrowClassName: string
  arrowStyle?: CSSProperties
  largeOnMobile?: boolean
  mapAlignedOnMobile?: boolean
}) {
  const useFullMapWidth = largeOnMobile || mapAlignedOnMobile

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-[2147483647]',
        useFullMapWidth
          ? 'w-full max-w-none'
          : 'w-fit max-w-[calc(100vw-2rem)]',
      )}
      style={style}
    >
      <div
        className={cn(
          'relative max-w-full',
          useFullMapWidth ? 'w-full' : 'w-fit',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute rotate-45 bg-[#1351B4]',
            largeOnMobile ? 'size-4' : 'size-3',
            arrowClassName,
          )}
          style={arrowStyle}
        />
        <div
          className={cn(
            'relative w-full rounded-lg bg-[#1351B4] shadow-lg',
            largeOnMobile
              ? 'px-6 py-7'
              : mapAlignedOnMobile
                ? 'px-6 py-6'
                : 'px-5 py-5 sm:px-8 sm:py-6 md:py-7',
          )}
          style={{
            minWidth: useFullMapWidth
              ? '100%'
              : `min(${TITLED_BALLOON_MIN_WIDTH}px, calc(100vw - 2rem))`,
            maxWidth: useFullMapWidth
              ? '100%'
              : `min(${TITLED_BALLOON_MIN_WIDTH}px, calc(100vw - 2rem))`,
          }}
        >
          {step.showStepBadge ? (
            <span
              className={cn(
                'absolute top-0 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white font-bold leading-none text-[#1351B4] [font-family:Rawline]',
                mapAlignedOnMobile
                  ? 'left-2 size-10 -translate-x-1/2 text-lg'
                  : largeOnMobile
                    ? 'left-[-2px] size-10 translate-x-0 text-lg'
                    : 'left-0 size-8 -translate-x-1/2 text-sm sm:size-9 sm:text-base',
              )}
            >
              {stepIndex + 1}
            </span>
          ) : null}
          <div
            className="mx-auto flex w-full flex-col items-center text-center"
            style={{
              maxWidth: useFullMapWidth
                ? '100%'
                : `min(${TITLED_BALLOON_CONTENT_WIDTH}px, calc(100vw - 4rem))`,
            }}
          >
            {step.title ? (
              <p
                className={cn(
                  'w-full font-semibold tracking-normal text-white [font-family:Rawline]',
                  largeOnMobile
                    ? 'text-[19px] leading-tight'
                    : 'text-[15px] leading-[100%]',
                )}
              >
                {step.title}
              </p>
            ) : null}
            {step.showTitleSeparator ? (
              <div
                className={cn(
                  'w-full shrink-0',
                  useFullMapWidth ? 'my-4' : 'my-3',
                )}
                style={{
                  height: 1,
                  minHeight: 1,
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #ffffff 0 1.5px, transparent 1.5px 3px)',
                }}
                aria-hidden
              />
            ) : null}
            <p
              className={cn(
                'w-full whitespace-pre-line font-normal tracking-normal text-white [font-family:Rawline]',
                largeOnMobile
                  ? 'text-[17px] leading-[1.45]'
                  : 'text-[15px]',
                mapAlignedOnMobile || step.descriptionAlign !== 'left'
                  ? 'text-center leading-snug'
                  : 'text-left leading-[1.55]',
              )}
            >
              {step.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MapTutorialBalloon({
  step,
  stepIndex,
  style,
  arrowClassName,
  arrowStyle,
  largeOnMobile = false,
  mapAlignedOnMobile = false,
}: {
  step: MapTutorialStep
  stepIndex: number
  style: CSSProperties
  arrowClassName: string
  arrowStyle?: CSSProperties
  largeOnMobile?: boolean
  mapAlignedOnMobile?: boolean
}) {
  const isCreateAlertStep = step.id === 'create-alert'
  const isTitledCardStep =
    Boolean(step.title) && Boolean(step.showTitleSeparator)

  if (isTitledCardStep) {
    return (
      <MapTutorialTitledCardBalloon
        step={step}
        stepIndex={stepIndex}
        style={style}
        arrowClassName={arrowClassName}
        arrowStyle={arrowStyle}
        largeOnMobile={largeOnMobile}
        mapAlignedOnMobile={mapAlignedOnMobile}
      />
    )
  }

  if (isCreateAlertStep) {
    return (
      <div
        className="pointer-events-none absolute z-[2147483647] w-fit max-w-[calc(100vw-2rem)]"
        style={style}
      >
        <div className="relative w-fit max-w-full">
          {step.handPointerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={step.handPointerSrc}
              alt=""
              aria-hidden
              className="absolute bottom-full left-[100%] z-20 mb-5 size-10 -translate-x-1/2 object-contain sm:size-11"
            />
          ) : null}

          <div className="relative flex items-center rounded-lg bg-[#1351B4] py-5 pl-8 pr-4 shadow-lg sm:py-6 sm:pl-10 sm:pr-5">
            {step.showStepBadge ? (
              <span className="absolute left-0 top-0 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-bold leading-none text-[#1351B4] [font-family:Rawline] sm:size-9 sm:text-base">
                {stepIndex + 1}
              </span>
            ) : null}
            <p className="max-w-[min(294px,calc(100vw-5rem))] text-[18px] font-normal leading-[1.45] tracking-normal text-white [font-family:Rawline] md:text-[17px] md:leading-snug">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none absolute z-[2147483647] w-[min(320px,calc(100vw-2rem))] rounded-lg bg-[#1351B4] px-4 py-3 text-white shadow-lg"
      style={style}
    >
      <span
        aria-hidden
        className={cn(
          'absolute size-3 rotate-45 bg-[#1351B4]',
          arrowClassName,
        )}
        style={arrowStyle}
      />
      {step.title ? (
        <p className="text-sm font-semibold leading-snug [font-family:Rawline]">
          {step.title}
        </p>
      ) : null}
      <p
        className={cn(
          'text-sm leading-snug [font-family:Rawline]',
          step.title ? 'mt-1' : undefined,
        )}
      >
        {step.description}
      </p>
    </div>
  )
}

export function MapTutorialOverlay({
  step,
  stepIndex,
  onNext,
}: MapTutorialOverlayProps) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [controlHoles, setControlHoles] = useState<ControlHole[]>([])
  const isLastStep = stepIndex + 1 >= MAP_TUTORIAL_STEP_COUNT

  const updateTargetRect = useCallback(() => {
    if (step.id === 'map-controls') {
      const holes = getMapControlHighlightHoles()
      setControlHoles(holes)
      setTargetRect(unionRects(holes))
      return
    }

    if (step.id === 'validated-alerts') {
      setControlHoles([])
      setTargetRect(getTargetRect(step.target))
      return
    }

    if (step.id === 'pending-alerts') {
      setControlHoles([])
      setTargetRect(getTargetRect(step.target))
      return
    }

    setControlHoles([])
    setTargetRect(getTargetRect(step.target))
  }, [step.id, step.target])

  useEffect(() => {
    setMounted(true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (step.id !== 'map-controls') {
      return
    }

    document.documentElement.setAttribute('data-map-tutorial-map-controls', '')
    return () => {
      document.documentElement.removeAttribute('data-map-tutorial-map-controls')
    }
  }, [step.id])

  useLayoutEffect(() => {
    updateTargetRect()
  }, [updateTargetRect])

  useEffect(() => {
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)
    const timer = window.setInterval(updateTargetRect, 300)
    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
      window.clearInterval(timer)
    }
  }, [updateTargetRect])

  const requiresTargetRect =
    step.centerBalloonOnScreen || step.id === 'map-controls'
  const isOverlayReady = mounted && (!requiresTargetRect || targetRect !== null)

  const isMapControlsMobile = isMobile && step.id === 'map-controls'
  const isMapAlignedTutorialMobile =
    isMobile &&
    (step.id === 'validated-alerts' || step.id === 'pending-alerts')

  const balloonLayout = useMemo(() => {
    const placement = step.placement ?? 'top'
    const viewportW =
      typeof window !== 'undefined' ? window.innerWidth : BALLOON_MAX_WIDTH
    const viewportH =
      typeof window !== 'undefined' ? window.innerHeight : 640
    const mapCanvasRect = getMapCanvasRect()
    let balloonW = step.showTitleSeparator
      ? getTitledBalloonWidth(viewportW, isMobile, {
          fullWidthOnMobile: isMapControlsMobile,
        })
      : Math.min(BALLOON_MAX_WIDTH, viewportW - VIEWPORT_MARGIN * 2)

    if ((isMapControlsMobile || isMapAlignedTutorialMobile) && mapCanvasRect) {
      balloonW = mapCanvasRect.width
    }
    const balloonBottomReserve = isMapControlsMobile ? 96 : isMobile ? 72 : 120

    if (!targetRect) {
      return {
        style: {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: balloonW,
        } as CSSProperties,
        arrowClassName: 'top-0 -translate-y-1/2',
      }
    }

    if (placement === 'left') {
      const controlCenterX = targetRect.left + targetRect.width / 2

      if (isMapControlsMobile) {
        const balloonCenterX = mapCanvasRect
          ? mapCanvasRect.left + mapCanvasRect.width / 2
          : viewportW / 2
        const top = clamp(
          targetRect.top +
            targetRect.height +
            MAP_CONTROLS_MOBILE_GAP_BELOW_CONTROLS_PX,
          VIEWPORT_MARGIN + 24,
          viewportH - VIEWPORT_MARGIN - balloonBottomReserve,
        )
        const arrowLeftPercent = getTopPlacementArrowLeftPercent(
          controlCenterX,
          balloonCenterX,
          balloonW,
        )

        return {
          style: {
            top,
            left: balloonCenterX,
            transform: 'translateX(-50%)',
            width: balloonW,
          } as CSSProperties,
          arrowClassName: 'top-0 -translate-x-1/2 -translate-y-1/2',
          arrowStyle: { left: `${arrowLeftPercent}%` },
        }
      }

      const top = clamp(
        targetRect.top + targetRect.height / 2,
        VIEWPORT_MARGIN + 48,
        viewportH - VIEWPORT_MARGIN - 48,
      )
      const left = clamp(
        targetRect.left - 16,
        VIEWPORT_MARGIN + balloonW,
        viewportW - VIEWPORT_MARGIN,
      )
      return {
        style: {
          top,
          left,
          transform: 'translate(-100%, -50%)',
          ...(step.showTitleSeparator ? {} : { width: balloonW }),
        } as CSSProperties,
        arrowClassName:
          'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
      }
    }

    const centerX = targetRect.left + targetRect.width / 2
    const balloonHorizontalOffset = step.balloonHorizontalOffsetPx ?? 0
    const left = clamp(
      centerX + balloonHorizontalOffset,
      VIEWPORT_MARGIN + balloonW / 2,
      viewportW - VIEWPORT_MARGIN - balloonW / 2,
    )

    if (step.id === 'create-alert') {
      const top = clamp(
        targetRect.top + targetRect.height * 0.58,
        VIEWPORT_MARGIN + 72,
        viewportH - VIEWPORT_MARGIN - 88,
      )
      return {
        style: {
          top,
          left,
          transform: 'translate(-50%, -50%)',
        } as CSSProperties,
        arrowClassName: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
      }
    }

    const top = clamp(
      targetRect.top + targetRect.height + 16,
      VIEWPORT_MARGIN + 24,
      viewportH - VIEWPORT_MARGIN - balloonBottomReserve,
    )

    const balloonCenterX = step.centerBalloonOnScreen
      ? mapCanvasRect
        ? mapCanvasRect.left + mapCanvasRect.width / 2
        : (getMapCanvasCenterX() ?? viewportW / 2)
      : left

    const arrowOffsetPercent = isMapAlignedTutorialMobile
      ? 0
      : (step.arrowOffsetPercent ?? 0)
    const arrowLeftPercent = getTopPlacementArrowLeftPercent(
      centerX,
      balloonCenterX,
      balloonW,
      arrowOffsetPercent,
    )

    const balloonLeft = balloonCenterX - balloonW / 2
    const pinScreenPosition = step.centerBalloonOnScreen
      ? {
          left: balloonLeft + (arrowLeftPercent / 100) * balloonW,
          top: targetRect.top + targetRect.height,
        }
      : undefined

    return {
      style: {
        top,
        left: balloonCenterX,
        transform: 'translateX(-50%)',
        width: balloonW,
      } as CSSProperties,
      arrowClassName: 'top-0 -translate-x-1/2 -translate-y-1/2',
      arrowStyle: { left: `${arrowLeftPercent}%` },
      pinScreenPosition,
    }
  }, [
    step.arrowOffsetPercent,
    step.balloonHorizontalOffsetPx,
    step.centerBalloonOnScreen,
    step.id,
    step.placement,
    step.showTitleSeparator,
    isMapAlignedTutorialMobile,
    isMapControlsMobile,
    targetRect,
  ])

  if (!isOverlayReady) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483646]"
      role="dialog"
      aria-modal
      aria-label={`Tutorial do mapa, passo ${stepIndex + 1} de ${MAP_TUTORIAL_STEP_COUNT}`}
    >
      {controlHoles.length > 0 ? (
        <ScrimWithControlHoles
          holes={controlHoles}
          scrimColor={OVERLAY_SCRIM}
          onScrimClick={isMobile ? onNext : undefined}
        />
      ) : (
        <div
          className="absolute inset-0 bg-black/55 pointer-events-auto"
          style={{ backgroundColor: OVERLAY_SCRIM }}
          aria-hidden
        />
      )}

      {isMobile && controlHoles.length === 0 ? (
        <button
          type="button"
          className="absolute inset-0 z-[1] cursor-default"
          aria-label="Avançar para o próximo passo do tutorial"
          onClick={onNext}
        />
      ) : null}

      {balloonLayout.pinScreenPosition ? (
        <div
          className={cn(
            'pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-full',
            step.id === 'validated-alerts'
              ? 'h-[50px] w-10 sm:h-[60px] sm:w-12'
              : 'h-[27px] w-5 sm:h-[32px] sm:w-6',
          )}
          style={{
            left: balloonLayout.pinScreenPosition.left,
            top: balloonLayout.pinScreenPosition.top,
          }}
          aria-hidden
        >
          {step.id === 'validated-alerts' ? (
            <TutorialValidatedPinMarker className="h-full w-full" />
          ) : (
            <TutorialPendingPinMarker className="h-full w-full" />
          )}
        </div>
      ) : null}

      <MapTutorialBalloon
        step={step}
        stepIndex={stepIndex}
        style={balloonLayout.style}
        arrowClassName={balloonLayout.arrowClassName}
        arrowStyle={balloonLayout.arrowStyle}
        largeOnMobile={isMobile && step.id === 'map-controls'}
        mapAlignedOnMobile={isMapAlignedTutorialMobile}
      />

      {!isMobile ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2147483647] flex justify-end p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-10">
          <button
            type="button"
            onClick={onNext}
            className="pointer-events-auto rounded-full bg-[#1351B4] px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#0f4599]"
          >
            {isLastStep ? 'Continuar' : 'Próximo'}
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
