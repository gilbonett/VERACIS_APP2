'use client'

import {
  ALERT_OPTIONAL_DESCRIPTION_PRESETS,
  AlertOptionalDescriptionField,
} from '@/components/alert-optional-description-field'
import { Button } from '@/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import { cn } from '@/lib/utils'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import { MAP_DIALOG_ANIMATION_CLASSES } from '../constants/dialog-animation'
import {
  type RiskSituationEntry,
  RISK_ICON_BASE,
  RISK_OUTRO_ICON_ID,
  RISK_SITUATION_HELP_BY_ICON,
  RISK_SITUATIONS,
} from '../constants/risk-events'
import {
  type ApiRiskRow,
  mapRiskIconSelectionToRiskIds,
} from '../constants/risk-api-map'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

const RISK_SELECTION_FRAME_SRC = '/categories/1008.svg'

type RiskAlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  onConfirm: (payload: {
    selectedIconIds: string[]
    optionalDescription: string
    riskIds: string[]
  }) => Promise<void>
  initialSelectedIconIds?: string[]
  initialOptionalDescription?: string
}

function RiskOptionGrid({
  items,
  selectedIds,
  onToggle,
  dialogOpen,
}: {
  items: readonly RiskSituationEntry[]
  selectedIds: ReadonlySet<string>
  onToggle: (icon: string) => void
  dialogOpen: boolean
}) {
  const [openHelpIconId, setOpenHelpIconId] = useState<string | null>(null)
  const helpBannerId = useId()

  useEffect(() => {
    if (!dialogOpen) setOpenHelpIconId(null)
  }, [dialogOpen])
  const openHelpText = openHelpIconId
    ? RISK_SITUATION_HELP_BY_ICON[openHelpIconId]
    : null

  const labelClassName =
    'text-pretty text-center text-[12px] font-semibold leading-[100%] tracking-normal text-[#5D5D5D]'

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="grid w-full grid-cols-3 grid-rows-auto gap-[10px] sm:grid-cols-3 sm:gap-x-5 sm:gap-y-5">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.icon)
          const helpText = RISK_SITUATION_HELP_BY_ICON[item.icon]

          const iconBlock = (
            <div className="relative size-[79.269px] shrink-0">
              {isSelected ? (
                <img
                  src={RISK_SELECTION_FRAME_SRC}
                  alt=""
                  className="pointer-events-none absolute inset-0 size-full object-contain"
                  width={77}
                  height={76}
                  aria-hidden
                />
              ) : null}
              <div
                className={
                  isSelected
                    ? 'relative z-[1] grid size-full place-items-center p-0.5'
                    : 'grid size-full place-items-center rounded-full bg-[#F0F0F0]'
                }
              >
                <img
                  src={`${RISK_ICON_BASE}/${item.icon}.svg`}
                  alt=""
                  title={item.label}
                  className={
                    item.icon === '5000'
                      ? 'max-h-[92%] max-w-[92%] shrink-0 origin-center scale-110 object-contain object-center'
                      : 'max-h-[85%] max-w-[85%] shrink-0 object-contain object-center'
                  }
                  width={item.icon === '5000' ? 62 : 56}
                  height={item.icon === '5000' ? 62 : 56}
                />
              </div>
            </div>
          )

          return (
            <div
              key={item.icon}
              className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2"
            >
              <button
                type="button"
                aria-label={`Selecionar ${item.label}`}
                aria-pressed={isSelected}
                onClick={() => onToggle(item.icon)}
                className="flex cursor-pointer flex-col items-center rounded-full focus:outline-none focus-visible:ring-0 sm:focus-visible:ring-2 sm:focus-visible:ring-ring sm:focus-visible:ring-offset-2"
              >
                {iconBlock}
              </button>

              {helpText ? (
                <Collapsible
                  className="flex w-full min-w-0 flex-col items-center"
                  open={openHelpIconId === item.icon}
                  onOpenChange={(next) =>
                    setOpenHelpIconId(next ? item.icon : null)
                  }
                >
                  <CollapsibleTrigger
                    type="button"
                    aria-label={`Informações sobre ${item.label}`}
                    aria-controls={
                      openHelpIconId === item.icon ? helpBannerId : undefined
                    }
                    className="group inline-flex max-w-full min-w-0 items-center justify-center gap-0.5 rounded-md py-0.5 [font-family:Rawline]"
                  >
                    <span
                      className={cn(
                        'min-w-0 shrink transition-colors duration-200',
                        labelClassName,
                        'group-data-[panel-open]:font-bold group-data-[panel-open]:text-[#1351B4]',
                      )}
                    >
                      {item.label}
                    </span>
                    <ChevronDown
                      strokeWidth={2.5}
                      className="size-[14px] shrink-0 text-[#848484] transition-transform duration-200 group-data-[panel-open]:rotate-180 group-data-[panel-open]:text-[#1351B4] sm:size-4"
                      aria-hidden
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="hidden" />
                </Collapsible>
              ) : (
                <span className="flex max-w-[79.269px] flex-col items-center gap-0.5 text-center [font-family:Rawline]">
                  <span className={cn('block max-w-full', labelClassName)}>
                    {item.label}
                  </span>
                </span>
              )}
            </div>
          )
        })}
      </div>

      {openHelpText ? (
        <div
          id={helpBannerId}
          role="region"
          aria-live="polite"
          className="mt-3 flex min-h-[67px] w-full shrink-0 items-center gap-3 bg-[#D3EBFF]/40 px-4 py-3 sm:px-[36px]"
        >
          <TriangleAlert
            className="size-5 shrink-0 text-[#1351B4]"
            strokeWidth={2}
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-pretty text-sm leading-snug text-[#1351B4] [font-family:Rawline]">
            {openHelpText}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function RiskAlertDialog({
  open,
  onOpenChange,
  onBack,
  onConfirm,
  initialSelectedIconIds,
  initialOptionalDescription,
}: RiskAlertDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [optionalDescription, setOptionalDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [apiRisks, setApiRisks] = useState<ApiRiskRow[]>([])
  const prevOpenRef = useRef(false)

  const toggleSelection = useCallback((icon: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(icon)) next.delete(icon)
      else next.add(icon)
      return next
    })
  }, [])

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (!open) {
      setSelectedIds(new Set())
      setOptionalDescription('')
      setApiRisks([])
      return
    }

    if (wasOpen) return

    const initial = Array.isArray(initialSelectedIconIds)
      ? initialSelectedIconIds
      : []
    setSelectedIds(new Set(initial))
    setOptionalDescription(initialOptionalDescription ?? '')

    void (async () => {
      try {
        const res = await fetch('/api/risks', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) {
          setApiRisks([])
          return
        }
        const data = (await res.json()) as unknown
        if (!Array.isArray(data)) {
          setApiRisks([])
          return
        }
        const rows: ApiRiskRow[] = []
        for (const item of data) {
          if (typeof item !== 'object' || item === null) continue
          const o = item as Record<string, unknown>
          if (typeof o.id !== 'string' || typeof o.name !== 'string') continue
          rows.push({ id: o.id, name: o.name })
        }
        setApiRisks(rows)
      } catch {
        setApiRisks([])
      }
    })()
  }, [open, initialOptionalDescription, initialSelectedIconIds])

  useEffect(() => {
    if (!selectedIds.has(RISK_OUTRO_ICON_ID)) {
      setOptionalDescription('')
    }
  }, [selectedIds])

  function handleBack() {
    setSelectedIds(new Set())
    setOptionalDescription('')
    onBack()
  }

  async function handleSave() {
    if (isSaving) return

    setIsSaving(true)
    try {
      const selectedIconIds = Array.from(selectedIds)
      const riskIds = mapRiskIconSelectionToRiskIds(selectedIconIds, apiRisks)
      await onConfirm({
        selectedIconIds,
        optionalDescription: optionalDescription.trim(),
        riskIds,
      })
      setSelectedIds(new Set())
      setOptionalDescription('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[calc(100dvh-3rem)] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_-1px_4px_0_#00000021] ring-0 ${MAP_DIALOG_ANIMATION_CLASSES} sm:h-[min(677px,90dvh)] sm:max-h-[min(677px,90dvh)] sm:w-[504px] sm:min-w-[504px] sm:max-w-[504px] sm:rounded-[18px] sm:ring-0`}
        overlayClassName={MAP_DIALOG_ANIMATION_CLASSES}
        showCloseButton
      >
        <DialogHeader className="flex-none gap-2 border-b border-[#E5E7EB] bg-[#FFFFFF] px-[36px] pb-[11px] pt-[41.89px] sm:px-[36px] sm:pt-[41.89px] sm:pb-[11px] sm:border-0">
          <DialogTitle className="w-fit text-[20px] font-bold leading-[100%] tracking-[0] text-[#333333] [font-family:Rawline]">
            Risco
          </DialogTitle>
          <p className="flex min-h-[17px] max-w-[164px] items-center text-left text-[12px] font-semibold leading-[100%] tracking-[0] text-[#848484] max-sm:max-w-none [font-family:Rawline]">
            Selecione riscos deste alerta
          </p>
          <DialogDescription className="hidden" />
        </DialogHeader>

        <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden bg-[#FBFBFB] [overscroll-behavior-y:contain] [touch-action:pan-y] [-webkit-overflow-scrolling:touch] max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:bg-transparent">
          {/*
          Banner default (instrução geral) desativado — mesmo visual reaplicado no bloco aberto pelo collapsible abaixo do grid.
          <div className="flex h-[67px] w-full max-w-[504px] shrink-0 items-center gap-3 bg-[#D3EBFF]/40 px-4 sm:px-[36px]">
            <TriangleAlert className="size-5 shrink-0 text-[#1351B4]" strokeWidth={2} aria-hidden />
            <p className="min-w-0 flex-1 text-pretty text-sm leading-snug text-[#1351B4] [font-family:Rawline]">
              Selecione um ou mais situações de risco que estão acontecendo neste alerta <span className="font-semibold">(opcional)</span>.
            </p>
          </div>
          */}

          <div className="flex flex-col pb-6 pt-[17px] max-sm:px-3 sm:ml-[11px] sm:mr-[12px] sm:px-0 sm:pb-2">
            <div className="flex w-full max-w-[481px] flex-col gap-[10px] rounded-[8px] bg-white px-4 py-5 pb-8 sm:w-[481px] sm:px-[15px]">
              <RiskOptionGrid
                dialogOpen={open}
                items={RISK_SITUATIONS}
                selectedIds={selectedIds}
                onToggle={toggleSelection}
              />
              {selectedIds.has(RISK_OUTRO_ICON_ID) && (
                <AlertOptionalDescriptionField
                  {...ALERT_OPTIONAL_DESCRIPTION_PRESETS.risk}
                  disclosureSize="lg"
                  expanded
                  value={optionalDescription}
                  onChange={setOptionalDescription}
                  textareaId="risk-alert-optional-description"
                  className="pt-4"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 flex h-[95px] min-h-[95px] w-full flex-none flex-row flex-nowrap items-center justify-between border-t border-[#E5E7EB] rounded-none bg-[#FFFFFF] px-4 py-0 sm:h-auto sm:min-h-0 sm:border-t-0 sm:justify-between sm:px-6 sm:pt-3 sm:pb-5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="h-[40.95px] min-h-[40.95px] w-[91px] min-w-[91px] gap-2 rounded-[20px] border-0 bg-[#FFFFFF] px-6 py-2 font-semibold text-[#1351B4] shadow-none hover:bg-[#F5F5F5] hover:opacity-100"
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-[50.4px] min-h-[50.4px] w-[112px] min-w-[112px] gap-2 rounded-[36px] border-0 bg-[#1351B4] px-6 py-2 font-semibold text-[#FFFFFF] shadow-none transition-all duration-300 ease-out hover:bg-[#0f3f8f] hover:opacity-100 disabled:pointer-events-none disabled:opacity-40 sm:h-[39px] sm:min-h-[39px] sm:w-auto sm:min-w-0 sm:rounded-full sm:py-0"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
