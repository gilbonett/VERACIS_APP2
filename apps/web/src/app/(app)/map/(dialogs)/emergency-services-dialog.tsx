'use client'

import { toastManager } from '@/components/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import { MAP_DIALOG_ANIMATION_CLASSES } from '../constants/dialog-animation'
import {
  EMERGENCY_CONTACTS,
  EMERGENCY_PHONE_ICON,
  EMERGENCY_WARNING_ICON,
} from '../constants/health-symptoms'

type EmergencyServicesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBack: () => void
}

function isMobileCallCapable(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const uaMobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(
    navigator.userAgent,
  )
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const smallViewport = window.matchMedia('(max-width: 768px)').matches

  return uaMobile || smallViewport || coarsePointer
}

export function EmergencyServicesDialog({
  open,
  onOpenChange,
  onBack: _onBack,
}: EmergencyServicesDialogProps) {
  function handleContactClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    contact: (typeof EMERGENCY_CONTACTS)[number],
  ) {
    if (isMobileCallCapable()) return

    event.preventDefault()
    const message = `${contact.name}: ${contact.phone}`

    toastManager.add({
      title: 'Ligue por telefone',
      description: message,
      type: 'info',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[calc(100dvh-3rem)] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl bg-[#FFFFFF] p-0 ${MAP_DIALOG_ANIMATION_CLASSES} sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2.5rem)] sm:max-w-[920px] sm:rounded-[18px]`}
        overlayClassName={MAP_DIALOG_ANIMATION_CLASSES}
        showCloseButton
      >
        <DialogHeader className="flex-none gap-0 border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 pb-5 pt-5 sm:px-6 sm:pt-6 sm:pb-4 sm:border-0">
          <DialogTitle className="font-sans text-[20px] font-bold leading-none text-[#333]">
            Chamada de Emergência
          </DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>

        <div className="min-h-0 w-full max-sm:flex-none sm:flex-1 overflow-y-auto overflow-x-hidden bg-[#FBFBFB] [overscroll-behavior-y:contain] [touch-action:pan-y] [-webkit-overflow-scrolling:touch] max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:bg-transparent">
          <div className="flex flex-col gap-3 px-3 pb-4 pt-4 sm:px-6 sm:pb-3 sm:pt-2">
            {EMERGENCY_CONTACTS.map((contact) => (
              <div
                key={contact.id}
                className="mx-auto flex min-h-[66px] w-full items-center justify-between gap-3 rounded-[8px] bg-[#F8F8F8]/[0.64] px-3 py-2 sm:h-[66px] sm:min-h-[66px] sm:px-5 sm:py-0"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <img
                    src={contact.icon}
                    alt=""
                    className={
                      contact.id === 'samu'
                        ? 'h-[27.089675903320312px] w-[28px] shrink-0 object-contain'
                        : contact.id === 'bombeiros'
                          ? 'size-[32px] shrink-0 object-contain'
                          : contact.id === 'ibama'
                            ? 'h-[27.940814971923828px] w-[32.36830139160156px] shrink-0 object-contain'
                            : 'size-[26px] shrink-0 object-contain'
                    }
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold leading-[100%] text-[#333333] [font-family:Rawline] align-middle">
                      {contact.name}
                    </p>
                    <p className="text-[12px] leading-[100%] font-semibold text-[#5D5D5D] [font-family:Rawline] align-middle">
                      {contact.phone}
                    </p>
                  </div>
                </div>

                <a
                  href={contact.phoneHref}
                  onClick={(event) => handleContactClick(event, contact)}
                  className="grid size-[40px] shrink-0 place-items-center rounded-full border border-[#1351B4] text-[#1351B4] transition-colors hover:bg-[#EAF2FF]"
                  aria-label={`Ligar para ${contact.name}`}
                >
                  <span className="sr-only">Ligar para {contact.name}</span>
                  <img
                    src={EMERGENCY_PHONE_ICON}
                    alt=""
                    className="size-[17px] object-contain"
                    aria-hidden
                  />
                </a>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="m-0 mb-3 flex h-[67px] w-full flex-none flex-row items-center justify-start gap-3 rounded-none border-0 border-t-0 bg-[#D3EBFF]/40 px-5 py-2 shadow-none">
          <img
            src={EMERGENCY_WARNING_ICON}
            alt="Aviso de alerta emergência"
            className="h-[28px] w-[28px] shrink-0 object-contain"
            aria-hidden
          />
          <p className="min-w-0 flex-1 align-middle text-[12px] font-semibold leading-[100%] text-[#1351B4] [font-family:Rawline]">
            Os alertas não substituem o pedido de socorro imediato.
            <br />
            <strong className="font-bold">
              O socorro urgente deve ser feito pelos canais oficiais.
            </strong>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
