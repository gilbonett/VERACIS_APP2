'use client'

import { useUser } from '@/contexts/user-context'
import { hideNextDevToolsButton } from '@/lib/hide-next-devtools-button'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MAP_TUTORIAL_STEPS } from './constants/map-tutorial-steps'
import { MapTutorialExamples } from './map-tutorial-examples'
import { MapTutorialOverlay } from './map-tutorial-overlay'
import { MapTutorialWelcomeDialog } from './map-tutorial-welcome-dialog'

export function MapTutorial() {
  const { user, patchUser } = useUser()
  const tutorialKey = user?.id ?? 'guest'
  const [stepIndex, setStepIndex] = useState(0)
  const [showWelcome, setShowWelcome] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mapCanvasLayoutTick, setMapCanvasLayoutTick] = useState(0)

  const shouldShowTutorial = useMemo(() => {
    if (!user || dismissed) return false
    return !user.mapTutorialCompletedAt
  }, [user, dismissed])

  useEffect(() => {
    if (!user?.mapTutorialCompletedAt) {
      setStepIndex(0)
      setShowWelcome(false)
      setDismissed(false)
    }
  }, [user?.id, user?.mapTutorialCompletedAt])

  useEffect(() => {
    if (!shouldShowTutorial || process.env.NODE_ENV !== 'development') {
      return
    }

    hideNextDevToolsButton()
    const intervalId = window.setInterval(hideNextDevToolsButton, 400)
    const observer = new MutationObserver(hideNextDevToolsButton)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    return () => {
      window.clearInterval(intervalId)
      observer.disconnect()
    }
  }, [shouldShowTutorial])

  const completeTutorial = useCallback(async () => {
    setIsCompleting(true)
    try {
      const res = await fetch('/api/users/me/map-tutorial/complete', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error('Falha ao salvar tutorial')
      }

      const data = (await res.json()) as {
        mapTutorialCompletedAt?: string | null
      }

      patchUser({
        mapTutorialCompletedAt:
          data.mapTutorialCompletedAt ?? new Date().toISOString(),
      })
      setDismissed(true)
      setShowWelcome(false)
    } catch (error) {
      console.error('[MapTutorial] complete failed', error)
    } finally {
      setIsCompleting(false)
    }
  }, [patchUser])

  const showExamplePins = shouldShowTutorial && !showWelcome && stepIndex >= 2

  useEffect(() => {
    if (!showExamplePins) {
      return
    }

    const syncMapCanvas = () => {
      setMapCanvasLayoutTick((tick) => tick + 1)
    }

    syncMapCanvas()
    window.addEventListener('resize', syncMapCanvas)
    return () => window.removeEventListener('resize', syncMapCanvas)
  }, [showExamplePins])

  const mapCanvasEl = useMemo(() => {
    if (!showExamplePins || typeof document === 'undefined') {
      return null
    }

    void mapCanvasLayoutTick
    return document.querySelector<HTMLElement>('[data-tour="map-canvas"]')
  }, [showExamplePins, mapCanvasLayoutTick])

  if (!shouldShowTutorial) {
    return null
  }

  if (showWelcome) {
    return (
      <MapTutorialWelcomeDialog
        open
        onComplete={() => void completeTutorial()}
        isCompleting={isCompleting}
      />
    )
  }

  const step = MAP_TUTORIAL_STEPS[stepIndex]
  if (!step) {
    return null
  }

  return (
    <>
      {showExamplePins && mapCanvasEl
        ? createPortal(
            <MapTutorialExamples activeStepId={step.id} />,
            mapCanvasEl,
          )
        : null}
      <MapTutorialOverlay
        key={`${tutorialKey}-step-${stepIndex}`}
        step={step}
        stepIndex={stepIndex}
        onNext={() => {
          if (stepIndex + 1 >= MAP_TUTORIAL_STEPS.length) {
            setShowWelcome(true)
            return
          }
          setStepIndex((i) => i + 1)
        }}
      />
    </>
  )
}
