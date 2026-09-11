'use client'

import { registerNotificationAction } from '@/actions/register-notification-action'
import { Button } from '@/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/form'
import { Label } from '@/components/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/sheet'
import { Spinner } from '@/components/spinner'
import { Textarea } from '@/components/textarea'
import { toastManager } from '@/components/toast'
import { useAdaptiveGeolocation } from '@/hooks/use-adaptive-geolocation'
import { GetEventsResponse } from '@/http/get-events'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks'
import { BellPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { notificationSchema } from '../notification.schema'
import { MarkerLocationDialog } from './marker-location-dialog'

type LocationType = {
  lat: number
  lng: number
}

type RegisterNotificationDialogProps = {
  initialLocation: LocationType
  events: GetEventsResponse[]
}

export function RegisterNotificationDialog({
  events,
  initialLocation,
}: RegisterNotificationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState<string>('CLIMATIC')
  const { coordinates } = useAdaptiveGeolocation()
  const [location, setLocation] = useState<LocationType>({
    lat: coordinates ? coordinates.latitude : initialLocation.lat,
    lng: coordinates ? coordinates.longitude : initialLocation.lng,
  })

  const {
    form,
    handleSubmitWithAction,
    action: { isPending },
  } = useHookFormAction(
    registerNotificationAction,
    zodResolver(notificationSchema),
    {
      formProps: {
        defaultValues: {
          description: '',
          eventId: '',
        },
      },
      actionProps: {
        onSuccess({ data: { message } }) {
          setIsOpen((prev) => !prev)
          toastManager.add({
            description: message,
            title: 'Success!',
            type: 'success',
          })
        },
      },
    },
  )

  const filteredEvents = useMemo(() => {
    const filered = events.filter((item) => item.category === category)

    return filered
  }, [category])

  useEffect(() => {
    form.resetField('eventId')
    form.reset({
      eventId: '',
    })
  }, [category])

  useEffect(() => {
    // let isMounted = true;

    // if (isMounted) {
    form.setValue('lat', location.lat)
    form.setValue('lng', location.lng)
    // }

    // return () => {
    //   isMounted = false;
    // };
  }, [location])

  function handleCancel() {
    form.resetField('description', {
      defaultValue: '',
    })
    form.reset({
      description: '',
      eventId: '',
    })
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger>
        <Button className="sm:min-w-37 sm:gap-3">
          <BellPlus className="size-4 sm:size-5" /> Notificar
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
        <SheetHeader className="border-b shadow-md h-14">
          <SheetTitle>Notificar</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={handleSubmitWithAction}
            className="w-full mt-2 px-2 md:px-4 lg:px-6 space-y-4"
          >
            <div className="space-y-2">
              <Label className="font-semibold">Típo de notificação</Label>
              <Select
                value={category}
                defaultValue={category}
                // onValueChange={setCategory}
              >
                <SelectTrigger className="w-full border-zinc-400">
                  <SelectValue placeholder="Selecione o tipo da notificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectContent align="center">
                    <SelectItem value="CLIMATIC">Climático</SelectItem>
                    <SelectItem value="ENVIRONMENTAL">Ambiental</SelectItem>
                    <SelectItem value="INFRASTRUCTURAL">
                      Infraestrutura
                    </SelectItem>
                  </SelectContent>
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="eventId"
              disabled={!category}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notificação*</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      defaultValue={field.value}
                      onValueChange={(e) => field.onChange(e)}
                    >
                      <SelectTrigger className="w-full border-zinc-400">
                        <SelectValue placeholder="Selecione uma notificação" />
                      </SelectTrigger>

                      <SelectContent align="center">
                        <SelectGroup>
                          <SelectLabel>Lista de notificações</SelectLabel>
                          {filteredEvents.map((item) => {
                            return (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a notificação"
                      className="h-16 sm:h-20 md:h-28 lg:h-36 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label className="font-semibold">Localização</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center px-4 w-full h-10 rounded-sm border border-zinc-300 italic text-muted-foreground">
                  {`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                </div>

                <MarkerLocationDialog onLocationSelected={setLocation} />
              </div>
            </div>

            <div className="text-muted-foreground text-end text-sm">
              Data: 16/09/2025 - Horário: 17:35
            </div>

            <div className="w-full flex justify-between items-center mt-4 sm:mt-6 md:mt-8 lg:mt-12">
              <Button
                onClick={handleCancel}
                type="button"
                variant="ghost"
                // className="w-24 text-primary font-semibold text-base hover:text-primary hover:bg-blue-100 hover:rounded-full"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {/*Salvar*/}
                {isPending ? <Spinner /> : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
