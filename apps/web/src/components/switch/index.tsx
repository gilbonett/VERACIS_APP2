import { cn } from '@/lib/utils'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { Check } from 'lucide-react'

export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'group/switch border inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-px outline-none bg-background data-disabled:opacity-64 sm:h-7 sm:w-11',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-input data-checked:bg-primary/80 shadow-sm transition-[translate,width] group-active/switch:not-data-disabled:w-5.5 data-checked:translate-x-4 data-unchecked:translate-x-0 data-checked:group-active/switch:translate-x-3.5 sm:size-5 sm:data-checked:translate-x-5 sm:group-active/switch:not-data-disabled:w-4.5 sm:data-checked:group-active/switch:translate-x-2.5"
      >
        <Check
          data-slot="switch-icon"
          className="size-3 text-input mt-1 ml-1"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}
