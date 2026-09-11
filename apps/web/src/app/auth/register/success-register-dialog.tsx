'use client'

import { IllustratedAlertDialog } from '@/components/illustrated-alert-dialog'

type SuccessRegisterFormProps = {
  isOpen: boolean
  onRedirect?: () => void
}

export function SuccessRegisterForm({
  isOpen,
  onRedirect,
}: SuccessRegisterFormProps) {
  return (
    <IllustratedAlertDialog
      open={isOpen}
      imageSrc="/auth/success-register.svg"
      imageAlt="Cadastro concluído com sucesso"
      title="Cadastro completo!"
      description={
        <>
          Agora você pode acessar a plataforma e participar ativamente da sua
          comunidade. <strong>Sua contribuição faz total diferença</strong>
        </>
      }
      buttonLabel="Acessar Agora"
      onButtonClick={onRedirect}
    />
  )
}
