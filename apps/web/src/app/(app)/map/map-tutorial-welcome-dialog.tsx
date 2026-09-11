'use client'

import { IllustratedAlertDialog } from '@/components/illustrated-alert-dialog'

type MapTutorialWelcomeDialogProps = {
  open: boolean
  onComplete: () => void
  isCompleting?: boolean
}

export function MapTutorialWelcomeDialog({
  open,
  onComplete,
  isCompleting = false,
}: MapTutorialWelcomeDialogProps) {
  return (
    <IllustratedAlertDialog
      open={open}
      imageSrc="/assets/tutorial/img-005.svg"
      imageAlt="Ilustração de boas-vindas à Plataforma VERACIS"
      imageWidth={418}
      imageHeight={235}
      title="Bem-vindo(a) à Plataforma VERACIS"
      description={
        <>
          Este é um espaço colaborativo criado para apoiar o{' '}
          <strong>
            registro, o monitoramento e o fortalecimento das ações no
            território.
          </strong>
        </>
      }
      buttonLabel={isCompleting ? 'Salvando...' : 'Começar'}
      onButtonClick={onComplete}
      buttonDisabled={isCompleting}
    />
  )
}
