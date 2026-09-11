'use client'

import type { MouseEvent, PointerEvent } from 'react'

import { cn } from '@/lib/utils'

import {
  MAP_ALERT_PIN_DISPLAY_HEIGHT_PX,
  MAP_ALERT_PIN_DISPLAY_WIDTH_PX,
  MAP_ALERT_PIN_INNER_ICON_PX,
} from './constants/map-alert-pin-display'

export const LAYOUT = {
  health: { iconCenterTopPct: 34, pinScale: 1.3, iconScale: 1.3 },
  risc: { iconCenterTopPct: 34, pinScale: 1.57, iconScale: 1.3 },
  environmental: { iconCenterTopPct: 38, pinScale: 1.28, iconScale: 2.1 },
  structural: { iconCenterTopPct: 38, pinScale: 1.28, iconScale: 1.3 },
} as const

export type AlertMapPinLayout = keyof typeof LAYOUT

type AlertMapPinWithIconProps = {
  pinSrc: string
  iconSrc: string
  layout: AlertMapPinLayout
  iconScaleOverride?: number
  'aria-label': string
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void
}

export function AlertMapPinWithIcon({
  pinSrc,
  iconSrc,
  layout,
  iconScaleOverride,
  'aria-label': ariaLabel,
  onClick,
  onPointerDown,
}: AlertMapPinWithIconProps) {
  const cfg = LAYOUT[layout]
  const pinW = MAP_ALERT_PIN_DISPLAY_WIDTH_PX * cfg.pinScale
  const pinH = MAP_ALERT_PIN_DISPLAY_HEIGHT_PX * cfg.pinScale
  const iconPx =
    MAP_ALERT_PIN_INNER_ICON_PX * (iconScaleOverride ?? cfg.iconScale)

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        'relative flex shrink-0 cursor-pointer justify-center rounded-none border-0 bg-transparent p-0 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[#1351B4] focus-visible:ring-offset-2',
      )}
      style={{
        width: pinW,
        height: pinH,
      }}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      <img
        src={pinSrc}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full max-w-none select-none object-contain"
        width={pinW}
        height={pinH}
      />
      <img
        src={iconSrc}
        alt=""
        className="pointer-events-none absolute left-1/2 max-h-none -translate-x-1/2 -translate-y-1/2 select-none object-contain"
        style={{
          top: `${cfg.iconCenterTopPct}%`,
          width: iconPx,
          height: iconPx,
        }}
      />
    </button>
  )
}
