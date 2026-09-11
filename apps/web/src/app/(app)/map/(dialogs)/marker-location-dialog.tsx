'use client'

import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dialog'
import { Map, MapAction } from '@/components/map'
import type { MapMouseEvent } from 'mapbox-gl'
import { useState } from 'react'
import { Marker } from 'react-map-gl/mapbox'

type MarkerLocationDialogProps = {
  onLocationSelected: (location: { lat: number; lng: number }) => void
}

export function MarkerLocationDialog({
  onLocationSelected,
}: MarkerLocationDialogProps) {
  const [location, setLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const [isOpen, setIsOpen] = useState(false)

  function onHandleMarker(event: MapMouseEvent) {
    const { lngLat } = event
    setLocation({
      lat: lngLat.lat,
      lng: lngLat.lng,
    })
  }

  function onHandleConfirm() {
    if (location) {
      onLocationSelected(location)
      setIsOpen(false)
      setLocation(null)
    }
  }

  function onHandleCancel() {
    setLocation(null)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button type="button" className="rounded-full w-fit">
          Selecione no mapa
        </Button>
      </DialogTrigger>

      <DialogContent className="h-full flex flex-col flex-1">
        <DialogHeader>
          <DialogTitle>Selecione uma localização</DialogTitle>
          <DialogDescription>
            Clique em qualquer ponto do mapa para marcar a localização desejada
          </DialogDescription>
        </DialogHeader>

        <Map>
          {/*<MapUserLocation />*/}
          <MapAction />

          {location && (
            <Marker
              longitude={location.lng}
              latitude={location.lat}
              anchor="bottom"
            >
              <div className="relative">
                {/* Pin do marcador */}
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-lg"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="#EF4444"
                  />
                </svg>
                {/* Animação de pulso */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
            </Marker>
          )}
        </Map>

        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium">Coordenadas:</p>
          <p className="text-muted-foreground">
            {location ? (
              <>
                Latitude: {location.lat.toFixed(6)} | Longitude:{' '}
                {location.lng.toFixed(6)}
              </>
            ) : (
              'Coordenadas não selecionadas'
            )}
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={onHandleCancel}
            variant="ghost"
            className="w-24 text-primary font-semibold text-base hover:text-primary hover:bg-blue-100 hover:rounded-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={onHandleConfirm}
            className="w-24 rounded-full font-semibold text-base"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
