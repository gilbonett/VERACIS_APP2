'use client'

type MapTutorialExamplesProps = {
  activeStepId: string
}

export function MapTutorialExamples({ activeStepId }: MapTutorialExamplesProps) {
  const showValidatedPin = activeStepId === 'validated-alerts'
  const showPendingPin = activeStepId === 'pending-alerts'

  return (
    <>
      {showValidatedPin ? (
        <div
          data-tour="validated-alert-example"
          className="pointer-events-none absolute left-[52%] top-[40%] z-[3] h-[50px] w-10 -translate-x-1/2 -translate-y-full opacity-0 sm:left-[53%] sm:top-[42%] sm:h-[60px] sm:w-12"
          aria-hidden
        />
      ) : null}
      {showPendingPin ? (
        <div
          data-tour="pending-alert-example"
          className="pointer-events-none absolute left-[58%] top-[38%] z-[3] h-[27px] w-5 -translate-x-1/2 -translate-y-full opacity-0 sm:left-[60%] sm:top-[40%] sm:h-[32px] sm:w-6"
          aria-hidden
        />
      ) : null}
    </>
  )
}
