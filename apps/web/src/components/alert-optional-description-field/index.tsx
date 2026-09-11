'use client'

import { Textarea } from '@/components/textarea'
import { cn } from '@/lib/utils'
import * as React from 'react'

export const DEFAULT_ALERT_OPTIONAL_PLACEHOLDER =
  'Digite informações adicionais que ajudem a descrever o alerta.'

export type AlertOptionalDescriptionPresetKey =
  | 'climatic'
  | 'ambiental'
  | 'estrutural'
  | 'risk'

export type AlertOptionalDescriptionPreset = {
  labelTitle?: string
  labelOptional?: string
  placeholder?: string
  textareaClassName?: string
}

export const ALERT_OPTIONAL_DESCRIPTION_EXPANDED_BLOCK_MIN_HEIGHT_PX =
  16 + 19 + 23 + 126

export const ALERT_OPTIONAL_DESCRIPTION_PRESETS: Record<
  AlertOptionalDescriptionPresetKey,
  AlertOptionalDescriptionPreset
> = {
  climatic: {
    placeholder:
      'Digite o tipo de alerta que deseja adicionar. Ex: Chuva ácida',
  },
  ambiental: {
    placeholder: DEFAULT_ALERT_OPTIONAL_PLACEHOLDER,
  },
  estrutural: {
    placeholder: DEFAULT_ALERT_OPTIONAL_PLACEHOLDER,
  },
  risk: {
    placeholder:
      'Descreva outro risco não listado. Ex: danos a propriedades particulares',
  },
}

export type AlertOptionalDescriptionFieldProps = {
  value: string
  onChange: (value: string) => void
  textareaId?: string
  className?: string
  labelTitle?: string
  labelOptional?: string
  placeholder?: string
  textareaClassName?: string
  expanded?: boolean
  disclosureSize?: 'sm' | 'lg'
  reserveSpaceWhenCollapsed?: boolean
}

function DisclosureTriangle({
  open,
  size = 'sm',
}: {
  open: boolean
  size?: 'sm' | 'lg'
}) {
  const dims =
    size === 'lg'
      ? { width: 14, height: 10, className: 'w-[14px] h-[10px]' as const }
      : { width: 10, height: 7, className: 'w-[10px] h-[7px]' as const }

  return (
    <svg
      width={dims.width}
      height={dims.height}
      viewBox="0 0 10 7"
      aria-hidden
      className={cn(
        'shrink-0 fill-[#1351B4] transition-transform duration-200',
        dims.className,
        open && 'rotate-180',
      )}
    >
      <path d="M0 0 L10 0 L5 7 Z" />
    </svg>
  )
}

const headerTypography =
  'font-sans text-[14px] leading-[100%] tracking-normal lining-nums proportional-nums text-[#333333] [font-family:Rawline]'

export function AlertOptionalDescriptionField({
  value,
  onChange,
  textareaId = 'alert-optional-description',
  className,
  labelTitle = 'Descrição',
  labelOptional = '(opcional)',
  placeholder = DEFAULT_ALERT_OPTIONAL_PLACEHOLDER,
  textareaClassName,
  expanded: expandedProp,
  disclosureSize = 'sm',
  reserveSpaceWhenCollapsed = false,
}: AlertOptionalDescriptionFieldProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(false)
  const controlled = expandedProp !== undefined
  const expanded = controlled ? expandedProp : internalExpanded

  const labelForA11y = `${labelTitle} ${labelOptional}`.trim()

  const headerInner = (
    <>
      <span className={cn(headerTypography, 'font-semibold')}>
        {labelTitle}
      </span>
      <span className={cn(headerTypography, 'font-medium')}>
        {labelOptional}
      </span>
      <DisclosureTriangle open={expanded} size={disclosureSize} />
    </>
  )

  return (
    <div
      className={cn('flex flex-col gap-[23px]', className)}
      style={
        reserveSpaceWhenCollapsed
          ? {
              minHeight:
                ALERT_OPTIONAL_DESCRIPTION_EXPANDED_BLOCK_MIN_HEIGHT_PX,
            }
          : undefined
      }
    >
      {controlled ? (
        <div
          className="pointer-events-none flex w-full min-h-[19px] flex-wrap items-center justify-start gap-x-2 rounded-md py-0 text-left select-none [font-family:Rawline]"
          role="group"
          aria-label={labelForA11y}
        >
          {headerInner}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setInternalExpanded((o) => !o)}
          className="flex w-full min-h-[19px] flex-wrap items-center justify-start gap-x-2 rounded-md py-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4] focus-visible:ring-offset-2 [font-family:Rawline]"
          aria-expanded={expanded}
          aria-label={labelForA11y}
        >
          {headerInner}
        </button>
      )}
      {expanded ? (
        <Textarea
          id={textareaId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'field-sizing-fixed box-border h-[126px] min-h-[126px] w-full max-w-[458px] resize-y rounded-[4px] border-2 border-solid border-[#C2850C] bg-[#FFFFFF] px-4 py-2 shadow-none',
            'outline-none focus-visible:border-[#C2850C] focus-visible:ring-2 focus-visible:ring-[#C2850C]/30 focus-visible:ring-offset-0',
            'font-sans text-[14px] font-normal leading-[100%] tracking-normal text-[#333333] lining-nums proportional-nums [font-family:Rawline]',
            'placeholder:font-sans placeholder:font-normal placeholder:text-[14px] placeholder:leading-[100%] placeholder:tracking-normal placeholder:text-[#5D5D5D] placeholder:lining-nums placeholder:proportional-nums placeholder:[font-family:Rawline]',
            textareaClassName,
          )}
        />
      ) : null}
    </div>
  )
}