'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/alert-dialog'
import { Button } from '@/components/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import type { ReactNode } from 'react'

export type IllustratedAlertDialogProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: ReactNode
  buttonLabel: string
  onButtonClick?: () => void
  buttonDisabled?: boolean
  secondaryButtonLabel?: string
  onSecondaryButtonClick?: () => void
  imageSrc?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  media?: ReactNode
}

export function IllustratedAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  buttonLabel,
  onButtonClick,
  buttonDisabled = false,
  secondaryButtonLabel,
  onSecondaryButtonClick,
  imageSrc,
  imageAlt = '',
  imageWidth = 418,
  imageHeight = 235,
  media,
}: IllustratedAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xs gap-0 overflow-hidden p-0 sm:max-w-sm md:max-w-md">
        <div>
          {media ??
            (imageSrc ? (
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={imageWidth}
                height={imageHeight}
                quality={100}
                className="h-auto w-full"
              />
            ) : null)}
        </div>

        <div className="space-y-2 px-4 pt-4">
          <h3 className="text-xl font-bold text-primary">{title}</h3>
          <div className="font-medium text-foreground">{description}</div>
        </div>

        <AlertDialogFooter
          className={cn(
            'mt-4 w-full px-4 pb-4',
            secondaryButtonLabel ? 'justify-between' : undefined,
          )}
        >
          {secondaryButtonLabel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onSecondaryButtonClick}
              className="min-w-[91px] rounded-full"
            >
              {secondaryButtonLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onButtonClick}
            disabled={buttonDisabled}
            className="min-w-28 rounded-full"
          >
            {buttonLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
