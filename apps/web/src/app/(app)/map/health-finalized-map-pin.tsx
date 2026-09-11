'use client'

import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  MAP_ALERT_PIN_DISPLAY_HEIGHT_PX,
  MAP_ALERT_PIN_DISPLAY_WIDTH_PX,
} from './constants/map-alert-pin-display'
import {
  HEALTH_MAP_PIN_FINALIZED_GIF_SRC,
  HEALTH_MAP_PIN_FINALIZED_SVG_SRC,
} from './constants/health-symptoms'
import { LAYOUT } from './alert-map-pin-with-icon'

const HEALTH_PIN_W = MAP_ALERT_PIN_DISPLAY_WIDTH_PX * LAYOUT.health.pinScale
const HEALTH_PIN_H = MAP_ALERT_PIN_DISPLAY_HEIGHT_PX * LAYOUT.health.pinScale

const WRAP_CLASS =
  'relative shrink-0 pointer-events-none block select-none'

const BASE_PIN_CLASS = 'absolute inset-0 size-full object-contain'

function StaticCheckInner() {
  return (
    <div className="absolute left-1/2 top-[5%] flex aspect-square w-[58%] -translate-x-1/2 items-center justify-center rounded-full bg-[#c8e6c9] p-[3px]">
      <div className="flex size-full min-h-0 min-w-0 items-center justify-center rounded-full bg-[#2e7d32]">
        <Check className="size-[55%] min-w-0 text-white" strokeWidth={3} />
      </div>
    </div>
  )
}

export function HealthFinalizedMapPin() {
  const [preferStatic, setPreferStatic] = useState(false)
  const [gifFailed, setGifFailed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setPreferStatic(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (preferStatic) {
    return (
      <div
        className={WRAP_CLASS}
        style={{
          width: HEALTH_PIN_W,
          height: HEALTH_PIN_H,
        }}
        aria-hidden
      >
        <img
          src={HEALTH_MAP_PIN_FINALIZED_SVG_SRC}
          alt=""
          className={BASE_PIN_CLASS}
          draggable={false}
        />
        <StaticCheckInner />
      </div>
    )
  }

  return (
    <div
      className={WRAP_CLASS}
      style={{
        width: HEALTH_PIN_W,
        height: HEALTH_PIN_H,
      }}
      aria-hidden
    >
      <img
        src={HEALTH_MAP_PIN_FINALIZED_SVG_SRC}
        alt=""
        className={BASE_PIN_CLASS}
        draggable={false}
      />
      {gifFailed ? (
        <StaticCheckInner />
      ) : (
        <div className="absolute left-1/2 top-[5%] aspect-square w-[58%] -translate-x-1/2 overflow-hidden rounded-full">
          <img
            src={HEALTH_MAP_PIN_FINALIZED_GIF_SRC}
            alt=""
            className="size-full object-cover object-center"
            draggable={false}
            onError={() => setGifFailed(true)}
          />
        </div>
      )}
    </div>
  )
}
