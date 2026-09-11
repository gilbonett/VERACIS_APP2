'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

export type EnumStyle = 'street' | 'satellite' | 'healtmap'

export interface MapStyle {
  value: EnumStyle
  label: string
  url: string
}

interface MapStyleSelectorProps {
  onSelectStyle?: (url: string) => void
}

export function MapStyleSelector({ onSelectStyle }: MapStyleSelectorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('street')

  const styles: MapStyle[] = [
    {
      value: 'street',
      label: 'Streets',
      //url: 'mapbox://styles/victorgc1/cmk2pl5mz004501rz0phwe1k5',
      url: 'mapbox://styles/mapbox/streets-v12',
    },
    {
      value: 'satellite',
      label: 'Satellite',
      url: 'mapbox://styles/victorgc1/cmk2pnjgp006a01s5cfli43yw',
    },
    {
      value: 'healtmap',
      label: 'Healtmap',
      url: 'mapbox://styles/victorgc1/cmk2qdkyf001f01qw4mea1oow',
    },
  ]

  const handleStyleChange = (style: MapStyle) => {
    if (onSelectStyle) {
      onSelectStyle(style.url)
    }

    setSelectedStyle(style.value)
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="inline-flex items-center overflow-visible rounded-full bg-background shadow-md transition-all duration-500 ease-in-out">
      <div
        className={`
          relative flex size-12 md:size-10 flex-row-reverse items-center justify-center rounded-full bg-background transition-all duration-500 ease-in-out
          ${isMenuOpen ? 'max-w-96 opacity-100' : 'max-w-16 opacity-100'}
        `}
      >
        <button
          type="button"
          data-tour-control="layers"
          onClick={toggleMenu}
          className="group flex size-12 md:size-10 items-center justify-center rounded-full bg-background hover:cursor-pointer"
        >
          <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path d="M2 17L12 22L22 17" />
            <path d="M2 12L12 17L22 12" />
          </svg>
        </button>

        <div
          className={`
            absolute h-9 md:h-10 right-11 bg-background flex items-center gap-2 transition-all duration-500 ease-in-out origin-right overflow-hidden rounded-full
            ${
              isMenuOpen
                ? 'opacity-100 scale-x-100 max-w-96'
                : 'opacity-0 scale-x-0 max-w-0 mr-0 pointer-events-none'
            }
          `}
        >
          {styles.map((style, index) => (
            <button
              type="button"
              key={style.value}
              onClick={() => handleStyleChange(style)}
              style={{
                transitionDelay: isMenuOpen ? `${index * 50}ms` : '0ms',
              }}
              className={cn(
                'w-16 md:w-20 h-full text-xs md:text-sm rounded-full shadow-md hover:cursor-pointer transition-all duration-300',
                style.value === selectedStyle
                  ? 'bg-primary text-background'
                  : 'bg-background text-blue-950',
              )}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
