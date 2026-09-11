'use client'

import { IllustratedAlertDialog } from '@/components/illustrated-alert-dialog'

type MapGuestLoginDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogin: () => void
}

export function MapGuestLoginDialog({
  open,
  onOpenChange,
  onLogin,
}: MapGuestLoginDialogProps) {
  return (
    <IllustratedAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      imageSrc="/assets/tutorial/img-006.svg"
      imageAlt="Faça login ou cadastre-se na Plataforma VERACIS"
      imageWidth={418}
      imageHeight={236}
      title="Faça Login ou cadastre-se"
      description="Para registrar alertas, validar informações e contribuir com o monitoramento do seu território faça login ou cadastre-se."
      buttonLabel="Entrar"
      onButtonClick={onLogin}
      secondaryButtonLabel="Voltar"
      onSecondaryButtonClick={() => onOpenChange(false)}
    />
  )
}
