'use client'

import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import { MAP_DIALOG_ANIMATION_CLASSES } from '../constants/dialog-animation'
import {
  HEALTH_ICON_BASE,
  HEALTH_PAINS,
  HEALTH_SYMPTOMS,
} from '../constants/health-symptoms'
import { useCallback, useEffect, useState } from 'react'

const HEALTH_SELECTION_FRAME_SRC = '/categories/1008.svg'

type HealthSymptomsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
  onConfirm: (selectedIconIds: string[]) => Promise<void>
}

function OptionGrid({
  items,
  selectedIds,
  onToggle,
}: {
  items: readonly { icon: string; label: string }[]
  selectedIds: ReadonlySet<string>
  onToggle: (icon: string) => void
}) {
  return (
    <div className="grid w-full grid-cols-3 grid-rows-auto gap-3 sm:grid-cols-5 sm:gap-x-5 sm:gap-y-5">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.icon)
        return (
          <button
            key={item.icon}
            type="button"
            aria-label={item.label}
            aria-pressed={isSelected}
            onClick={() => onToggle(item.icon)}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-0 sm:gap-2 sm:focus-visible:ring-2 sm:focus-visible:ring-ring sm:focus-visible:ring-offset-2"
          >
            <div className="relative size-[76px] shrink-0 sm:size-[82px] md:size-[88px]">
              {isSelected ? (
                <img
                  src={HEALTH_SELECTION_FRAME_SRC}
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
                    ? 'relative z-[1] grid size-full place-items-center p-1'
                    : 'grid size-full place-items-center rounded-full border border-[#E5E7EB] bg-[#F0F0F0]'
                }
              >
                <img
                  src={`${HEALTH_ICON_BASE}/${item.icon}.svg`}
                  alt=""
                  title={item.label}
                  className="max-h-[75%] max-w-[75%] object-contain object-center"
                  width={45}
                  height={40}
                />
              </div>
            </div>
            <span className="text-center text-xs font-medium text-foreground sm:text-sm">
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function HealthSymptomsDialog({
  open,
  onOpenChange,
  onBack,
  onConfirm,
}: HealthSymptomsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [isSaving, setIsSaving] = useState(false)

  const toggleSelection = useCallback((icon: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(icon)) next.delete(icon)
      else next.add(icon)
      return next
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set())
    }
  }, [open])

  function handleBack() {
    setSelectedIds(new Set())
    onOpenChange(false)
    onBack()
  }

  async function handleSave() {
    if (selectedIds.size === 0 || isSaving) return

    setIsSaving(true)
    try {
      await onConfirm(Array.from(selectedIds))
      setSelectedIds(new Set())
      onOpenChange(false)
      onBack()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[calc(100dvh-3rem)] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 ${MAP_DIALOG_ANIMATION_CLASSES} sm:h-auto sm:max-h-[90vh] sm:w-[560px] sm:max-w-[560px] md:w-[600px] md:max-w-[600px] sm:rounded-[18px]`}
        overlayClassName={MAP_DIALOG_ANIMATION_CLASSES}
        showCloseButton
      >
        <DialogHeader className="flex-none gap-0 border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 pb-5 pt-5 sm:px-6 sm:pt-6 sm:pb-4 sm:border-0">
          <DialogTitle className="font-sans text-[20px] font-bold leading-none text-[#333]">
            O que você está sentindo?
          </DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>

        <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden bg-[#FBFBFB] [overscroll-behavior-y:contain] [touch-action:pan-y] [-webkit-overflow-scrolling:touch] max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:bg-transparent">
          <div className="flex flex-col gap-5 pt-4 pb-6 max-sm:px-3 sm:px-6 sm:pb-2 sm:pt-2">
            <div className="max-sm:bg-transparent max-sm:p-0 sm:rounded-xl sm:bg-[#F8F8F8] sm:px-4 sm:py-5">
              <OptionGrid
                items={HEALTH_SYMPTOMS}
                selectedIds={selectedIds}
                onToggle={toggleSelection}
              />
            </div>

            <div className="flex flex-col gap-5 sm:gap-6">
              <span className="font-sans text-base font-bold leading-none text-[#333] sm:text-[18px]">
                Dores
              </span>
              <div className="max-sm:bg-transparent max-sm:p-0 sm:rounded-xl sm:bg-[#F8F8F8] sm:px-4 sm:py-5">
                <OptionGrid
                  items={HEALTH_PAINS}
                  selectedIds={selectedIds}
                  onToggle={toggleSelection}
                />
              </div>
            </div>

            <div className="flex min-h-[67px] w-full items-center gap-3 rounded-[8px] border border-[#1351B4]/25 bg-[#D3EBFF] px-3 py-2 sm:h-[67px] sm:px-4">
              <img
                src={`${HEALTH_ICON_BASE}/2015.svg`}
                alt=""
                width={27}
                height={24}
                className="shrink-0"
                aria-hidden
              />
              <p className="min-w-0 flex-1 text-pretty text-sm leading-snug text-[#1351B4]">
                Os alertas de saúde são visualizados somente por{'\u00A0'}
                <strong className="font-bold">
                  agentes comunitários de saúde
                </strong>
                .
              </p>
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
            disabled={selectedIds.size === 0 || isSaving}
            className="h-[50.4px] min-h-[50.4px] w-[112px] min-w-[112px] gap-2 rounded-[36px] border-0 bg-[#1351B4] px-6 py-2 font-semibold text-[#FFFFFF] shadow-none transition-all duration-300 ease-out hover:bg-[#0f3f8f] hover:opacity-100 disabled:pointer-events-none disabled:opacity-40 sm:h-[39px] sm:min-h-[39px] sm:w-auto sm:min-w-0 sm:rounded-full sm:py-0"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
