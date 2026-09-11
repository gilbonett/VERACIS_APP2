'use client'

import Image from 'next/image'
import { useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
// import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/alert-dialog'
import { Button } from '@/components/button'
import { Checkbox } from '@/components/checkbox'
import { Label } from '@/components/label'
import { toastManager } from '@/components/toast'

export function ActiveLocationBrowserDialog() {
  const [queryLat, setQueryLat] = useQueryState('utm_lat')
  const [queryLng, setQueryLng] = useQueryState('utm_lng')
  const [isOpen, setIsOpen] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    if (queryLat && queryLng) {
      setIsChecked(true)
    }
  }, [queryLat, queryLng])

  function handleChecked(value: boolean) {
    setIsOpen(true)
    setIsChecked(value)
  }

  function handleCancel() {
    setIsChecked(false)
    setIsOpen(false)
    setQueryLat(null)
    setQueryLng(null)
  }

  function handleAccept() {
    if (!navigator.geolocation) {
      setIsChecked(false)
      setIsOpen(false)
      return toastManager.add({
        type: 'warning',
        title: 'Aviso!',
        description: 'Geolocalização não é suportada pelo seu navegador.',
      })
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        setQueryLat(latitude.toString())
        setQueryLng(longitude.toString())

        setIsChecked(true)
        setIsOpen(false)
      },
      (error) => {
        let errorMessage = 'Não foi possível obter sua localização.'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Você negou a permissão de localização. Por favor, habilite nas configurações do navegador.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informação de localização não disponível.'
            break
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao tentar obter localização.'
            break
        }

        // toast.warning(errorMessage);

        toastManager.add({
          type: 'warning',
          title: 'Aviso!',
          description: errorMessage,
        })
        setIsChecked(false)
        setIsOpen(false)
      },
      {
        enableHighAccuracy: true, // Usa GPS se disponível
        timeout: 10000, // Timeout de 10 segundos
        maximumAge: 0, // Não usa cache
      },
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <Checkbox
          id="location"
          className="border-zinc-400"
          checked={isChecked}
          onCheckedChange={(e) => handleChecked(Boolean(e))}
        />
        <Label htmlFor="location">Compartilhar localização</Label>
      </div>

      <AlertDialogContent className="max-w-xs md:max-w-138 md:h-66 flex flex-col justify-around">
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <Image
            src="/assets/warning.png"
            alt="success dialog icon"
            width={40}
            height={40}
          />
        </div>

        <div className="px-6 text-center">
          <h3 className="text-primary text-[20px] font-semibold  my-4">
            Atenção
          </h3>
          <span className="text-center text-base">
            A plataforma VERACIS precisa saber a localização para <br />
          </span>
          <span className="text-center font-bold">
            compartilhar os dados e funcionalidades de forma segura.
          </span>
        </div>

        <AlertDialogFooter className="px-6 flex">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleAccept}>Aceitar</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
