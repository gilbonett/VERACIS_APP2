import { cn } from '@/lib/utils'
import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete'
import { XIcon } from 'lucide-react'

export const Autocomplete = AutocompletePrimitive.Root

export function AutocompleteInput({
  className,
  showTrigger = false,
  showClear = false,
  startAddon,
  size,
  ...props
}: Omit<AutocompletePrimitive.Input.Props, 'size'> & {
  showTrigger?: boolean
  showClear?: boolean
  startAddon?: React.ReactNode
  size?: 'sm' | 'default' | 'lg' | number
  ref?: React.Ref<HTMLInputElement>
}) {
  // const sizeValue = (size ?? "default") as "default" | "sm" | "lg" | number;

  return (
    <div
      className={cn(
        'group w-full flex items-center border h-10 rounded-sm px-2 focus-within:ring-ring',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
      )}
    >
      {startAddon && (
        <div
          data-slot="autocomplete-start-addon"
          className="group-focus-within:text-zinc-700 text-muted-foreground"
        >
          {startAddon}
        </div>
      )}
      <AutocompletePrimitive.Input
        data-slot="autocomplete-input"
        className={cn('w-full', className)}
        // render={<Input className="border-0 focus-visible:ring-0" />}
        {...props}
      />

      {showClear && (
        <AutocompleteClear className="group-focus-within:text-zinc-700 text-muted-foreground" />
      )}
    </div>
  )
}

export function AutocompletePopup({
  // className,
  // children,
  sideOffset = 4,
  // ...props
}: AutocompletePrimitive.Popup.Props & {
  sideOffset?: number
}) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        className="z-50 select-none"
        data-slot="autocomplete-positioner"
        sideOffset={sideOffset}
      ></AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  )
}

function AutocompleteClear({
  className,
  ...props
}: AutocompletePrimitive.Clear.Props) {
  return (
    <AutocompletePrimitive.Clear
      className={cn('hover:cursor-pointer', className)}
      data-slot="autocomplete-clear"
      {...props}
    >
      <XIcon />
    </AutocompletePrimitive.Clear>
  )
}
