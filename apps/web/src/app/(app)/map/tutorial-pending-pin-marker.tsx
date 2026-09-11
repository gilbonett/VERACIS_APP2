'use client'

import { cn } from '@/lib/utils'
import { useId } from 'react'

type TutorialPendingPinMarkerProps = {
  className?: string
}

export function TutorialPendingPinMarker({
  className,
}: TutorialPendingPinMarkerProps) {
  const rawId = useId().replace(/:/g, '')
  const filterId = `tutorial-pending-pin-filter-${rawId}`

  return (
    <svg
      viewBox="0 0 20 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block shrink-0', className)}
      aria-hidden
    >
      <g filter={`url(#${filterId})`}>
        <path
          d="M11.4251 1.52351C15.4808 2.36493 18.0866 6.33488 17.2452 10.3907C16.6522 13.2489 14.5047 15.3843 11.8691 16.1032C11.8654 16.1182 11.8631 16.134 11.8587 16.1489L10.7044 20.0445C10.4026 21.0618 8.93219 20.9702 8.7588 19.9231L8.13463 16.1533C4.21901 15.2062 1.73349 11.3175 2.55791 7.34363C3.39932 3.28786 7.36928 0.6821 11.4251 1.52351Z"
          fill="white"
        />
      </g>
      <rect
        x="5.63342"
        y="2.3645"
        width="11"
        height="11"
        rx="5.5"
        transform="rotate(11.7204 5.63342 2.3645)"
        fill="#FFD99D"
      />
      <defs>
        <filter
          id={filterId}
          x="0"
          y="1.36572"
          width="19.8031"
          height="24.7943"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology
            radius="1"
            operator="erode"
            in="SourceAlpha"
            result="effect1_dropShadow"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.7" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  )
}
