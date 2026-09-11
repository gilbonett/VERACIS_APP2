import { Button } from '@/components/button'
import { Label } from '@/components/label'
import { Separator } from '@/components/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/sheet'
import { Switch } from '@/components/switch'
import { SlidersHorizontal } from 'lucide-react'

export function MapFiltersDialog() {
  return (
    <Sheet>
      <SheetTrigger>
        <Button
          className="sm:min-w-37"
          // className="group relative flex-1 h-8 text-xs md:text-sm md:w-40 md:h-10 rounded-full border-2 border-primary text-primary hover:text-blue-900 hover:bg-blue-50"
          variant="outline"
        >
          <SlidersHorizontal className="absolute left-2 size-4 sm:size-5" />
          <span>Filtros</span>
          <div className="absolute right-2 bg-primary size-5.25 text-sm sm:text-base sm:size-6.25 rounded-full text-secondary">
            5
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-sm md:max-w-md lg:max-w-lg">
        <SheetHeader className="border-b shadow-md h-14">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div className="px-4 flex flex-col gap-4 mt-4">
          <div className="flex justify-between items-center">
            <Label className="text-lg font-light">Todos</Label>
            <Switch />
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Label className="text-lg font-light">Alertas de Saúde</Label>
            <Switch />
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Label className="text-lg font-light">Alertas de Clima</Label>
            <Switch />
          </div>
          <Separator />

          <div className="flex justify-between items-center">
            <Label className="text-lg font-light">Alertas Ambientais</Label>
            <Switch />
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Label className="text-lg font-light">
              Alertas de Infraestrutura
            </Label>
            <Switch />
          </div>

          <Separator />
        </div>

        <div className="flex justify-end items-center mt-12 sm:mt-14 md:mt-16 lg:mt-18 px-4 gap-2">
          <Button
            // variant="outline"
            variant="ghost"
          >
            Limpar
          </Button>
          <Button>Filtrar</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
