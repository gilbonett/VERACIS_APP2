'use client'

import {
  ALERT_OPTIONAL_DESCRIPTION_PRESETS,
  AlertOptionalDescriptionField,
} from '@/components/alert-optional-description-field'
import { Button } from '@/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import { Input, InputControl } from '@/components/input'
import { cn } from '@/lib/utils'
import { MAP_DIALOG_ANIMATION_CLASSES } from '../constants/dialog-animation'
import {
  MAP_ALERT_SEARCH_INPUT_CLASS,
  mapAlertSearchInputControlClassName,
} from '../constants/map-alert-search-field'
import {
  type EnvironmentalAlertTypeEntry,
  ENVIRONMENTAL_ALERT_TYPES,
  ENVIRONMENTAL_ICON_BASE,
  ENVIRONMENTAL_OUTRO_ICON_ID,
  getEnvironmentalIconLayout,
} from '../constants/environmental-events'
import {
  MAP_ALERT_OPTION_CIRCLE_PX,
  MAP_ALERT_OPTION_ICON_INSET_PX,
  MAP_ALERT_OPTION_ICON_PX,
} from '../constants/map-alert-option-grid'
import { useCallback, useEffect, useMemo, useState } from 'react'

const SELECTION_FRAME_SRC = '/categories/1008.svg'

function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
}

type EnvironmentalAlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  onConfirm: (payload: {
    iconId: string
    optionalDescription: string
  }) => Promise<void>
  restoreDraft?: { iconId: string; optionalDescription: string } | null
  onRestoreDraftConsumed?: () => void
}

function EnvironmentalOptionGrid({
  items,
  selectedId,
  onSelect,
}: {
  items: readonly EnvironmentalAlertTypeEntry[]
  selectedId: string | null
  onSelect: (icon: string) => void
}) {
  return (
    <div className="grid w-full grid-cols-3 grid-rows-auto gap-[10px] sm:grid-cols-5">
      {items.map((item) => {
        const isSelected = selectedId === item.icon
        const iconLayout = getEnvironmentalIconLayout(item.icon)
        return (
          <button
            key={item.icon}
            type="button"
            aria-label={item.label}
            aria-pressed={isSelected}
            onClick={() => onSelect(item.icon)}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-0 sm:gap-2 sm:focus-visible:ring-2 sm:focus-visible:ring-ring sm:focus-visible:ring-offset-2"
          >
            <div
              className="relative shrink-0"
              style={{
                width: MAP_ALERT_OPTION_CIRCLE_PX,
                height: MAP_ALERT_OPTION_CIRCLE_PX,
              }}
            >
              {isSelected ? (
                <img
                  src={SELECTION_FRAME_SRC}
                  alt=""
                  className="pointer-events-none absolute inset-0 size-full object-contain"
                  width={MAP_ALERT_OPTION_CIRCLE_PX}
                  height={MAP_ALERT_OPTION_CIRCLE_PX}
                  aria-hidden
                />
              ) : null}
              <div
                className={
                  isSelected
                    ? 'relative z-[1] box-border grid size-full place-items-center rounded-full'
                    : 'box-border grid size-full place-items-center rounded-full bg-[#F0F0F0]'
                }
                style={{ padding: MAP_ALERT_OPTION_ICON_INSET_PX }}
              >
                <img
                  src={`${ENVIRONMENTAL_ICON_BASE}/${item.icon}.svg`}
                  alt=""
                  title={item.label}
                  width={Math.round(iconLayout.width)}
                  height={Math.round(iconLayout.height)}
                  style={{
                    width: iconLayout.width,
                    height: iconLayout.height,
                  }}
                  className="shrink-0 object-contain object-center"
                />
              </div>
            </div>
            <span className="flex max-w-20 flex-col items-center gap-0.5 text-center [font-family:Rawline]">
              {item.lines.map((line, idx) => {
                const isSecond = idx === 1
                const muted = Boolean(isSecond && item.secondLineMuted)
                return (
                  <span
                    key={`${item.icon}-${idx}`}
                    className={cn(
                      'block w-full max-w-full text-pretty leading-[100%] tracking-normal',
                      muted
                        ? 'text-[10px] font-medium text-[#9A9898]'
                        : 'text-[12px] font-semibold text-[#5D5D5D]',
                    )}
                  >
                    {line}
                  </span>
                )
              })}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function EnvironmentalAlertDialog({
  open,
  onOpenChange,
  onBack,
  onConfirm,
  restoreDraft = null,
  onRestoreDraftConsumed,
}: EnvironmentalAlertDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [optionalDescription, setOptionalDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const filteredItems = useMemo(() => {
    const q = normalizeSearch(search)
    if (!q) return ENVIRONMENTAL_ALERT_TYPES
    return ENVIRONMENTAL_ALERT_TYPES.filter((item) =>
      normalizeSearch(item.label).includes(q),
    )
  }, [search])

  const selectIcon = useCallback((icon: string) => {
    setSelectedId((prev) => (prev === icon ? null : icon))
  }, [])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedId(null)
      setOptionalDescription('')
    }
  }, [open])

  useEffect(() => {
    if (!open || !restoreDraft) return
    setSearch('')
    setSelectedId(restoreDraft.iconId)
    setOptionalDescription(restoreDraft.optionalDescription)
    onRestoreDraftConsumed?.()
  }, [open, restoreDraft, onRestoreDraftConsumed])

  useEffect(() => {
    if (selectedId !== ENVIRONMENTAL_OUTRO_ICON_ID) {
      setOptionalDescription('')
    }
  }, [selectedId])

  function handleBack() {
    setSearch('')
    setSelectedId(null)
    setOptionalDescription('')
    onOpenChange(false)
    onBack()
  }

  async function handleSave() {
    if (!selectedId || isSaving) return

    setIsSaving(true)
    try {
      await onConfirm({
        iconId: selectedId,
        optionalDescription: optionalDescription.trim(),
      })
      setSearch('')
      setSelectedId(null)
      setOptionalDescription('')
      onOpenChange(false)
      onBack()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[calc(100dvh-3rem)] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_-1px_4px_0_#00000021] ring-0 ${MAP_DIALOG_ANIMATION_CLASSES} sm:h-[min(730px,90dvh)] sm:max-h-[min(730px,90dvh)] sm:w-[504px] sm:max-w-[504px] sm:rounded-[18px] sm:ring-0`}
        overlayClassName={MAP_DIALOG_ANIMATION_CLASSES}
        showCloseButton={false}
      >
        <DialogHeader className="flex-none gap-0 border-b border-[#E5E7EB] bg-[#FFFFFF] pb-5 pt-5 sm:pt-[41.89px] sm:pb-4 sm:border-0">
          <div className="flex items-center justify-between gap-3 px-[15px]">
            <div className="min-w-0 flex-1 pl-[21px]">
              <DialogTitle className="m-0 max-w-[min(163px,100%)] text-left font-sans text-[20px] font-bold leading-none tracking-normal text-[#333333] [font-family:Rawline]">
                Alerta Ambiental
              </DialogTitle>
            </div>
            <DialogClose
              render={
                <button
                  type="button"
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#333333] outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Fechar"
                >
                  <span
                    className="fas fa-times text-[16px] leading-none tracking-normal"
                    aria-hidden
                  />
                </button>
              }
            />
          </div>
          <div className="mt-3 px-[15px]">
            <Input
              className={cn(
                'h-[39px] w-full max-w-[477px]',
                MAP_ALERT_SEARCH_INPUT_CLASS,
              )}
            >
              <InputControl
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar"
                autoComplete="off"
                className={mapAlertSearchInputControlClassName()}
                style={{ borderColor: 'transparent', boxShadow: 'none' }}
                aria-label="Buscar tipo de alerta ambiental"
              />
            </Input>
          </div>
          <DialogDescription className="hidden" />
        </DialogHeader>

        <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden bg-[#FBFBFB] [overscroll-behavior-y:contain] [touch-action:pan-y] [-webkit-overflow-scrolling:touch] max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:bg-transparent">
          <div className="flex flex-col gap-5 pt-4 pb-6 max-sm:px-3 sm:px-[15px] sm:pb-2 sm:pt-2">
            <div className="flex w-full max-w-[477px] flex-col gap-[10px] max-sm:bg-transparent max-sm:p-0 sm:rounded-xl sm:bg-[#F8F8F8] sm:px-[15px] sm:py-5">
              <EnvironmentalOptionGrid
                items={filteredItems}
                selectedId={selectedId}
                onSelect={selectIcon}
              />
              {selectedId === ENVIRONMENTAL_OUTRO_ICON_ID && (
                <AlertOptionalDescriptionField
                  {...ALERT_OPTIONAL_DESCRIPTION_PRESETS.ambiental}
                  expanded
                  value={optionalDescription}
                  onChange={setOptionalDescription}
                  textareaId="environmental-alert-optional-description"
                  className="pt-4"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 flex h-[95px] min-h-[95px] w-full flex-none flex-row flex-nowrap items-center justify-between border-t border-[#E5E7EB] rounded-none bg-[#FFFFFF] px-[15px] py-0 sm:h-auto sm:min-h-0 sm:border-t-0 sm:justify-between sm:px-[15px] sm:pt-3 sm:pb-5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="box-border h-[39px] min-h-[39px] w-[91px] min-w-[91px] gap-[8px] rounded-[20px] border-0 bg-[#FFFFFF] px-[24px] py-[8px] font-semibold text-[#1351B4] shadow-none hover:bg-[#F5F5F5] hover:opacity-100"
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!selectedId || isSaving}
            className={cn(
              'box-border h-[39px] min-h-[39px] min-w-[98px] shrink-0 gap-[8px] rounded-[20px] border-0 bg-[#1351B4] px-[24px] py-[8px] font-semibold text-[#FFFFFF] shadow-none transition-all duration-300 ease-out hover:bg-[#0f3f8f] hover:opacity-100 disabled:pointer-events-none disabled:opacity-40',
              isSaving ? 'w-auto' : 'w-[98px]',
            )}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
