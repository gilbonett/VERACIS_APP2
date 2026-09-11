'use client'

import { Button } from '@/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dialog'
import { useMap } from '@/components/map'
import { toastManager } from '@/components/toast'
import { getApiErrorMessage } from '@/http/parse-api-error-message'
import { useUser } from '@/contexts/user-context'
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { ClimaticAlertDialog } from './(dialogs)/climatic-alert-dialog'
import { EnvironmentalAlertDialog } from './(dialogs)/environmental-alert-dialog'
import { StructuralAlertDialog } from './(dialogs)/structural-alert-dialog'
import { EmergencyServicesDialog } from './(dialogs)/emergency-services-dialog'
import { HealthSymptomsDialog } from './(dialogs)/health-symptoms-dialog'
import { RiskAlertDialog } from './(dialogs)/risk-alert-dialog'
import { canCreateAlerts } from './constants/alert-permissions'
import { MAP_DIALOG_ANIMATION_CLASSES } from './constants/dialog-animation'
import {
  dispatchClimaticAlertCreatedDetail,
  dispatchEnvironmentalAlertCreatedDetail,
  dispatchStructuralAlertCreatedDetail,
  requestClimaticAlertsRefresh,
  requestEnvironmentalAlertsRefresh,
  requestHealthAlertsRefresh,
  requestStructuralAlertsRefresh,
} from './constants/health-alerts-refresh'
import { mapClimaticIconToEventIds } from './constants/climatic-event-ids'
import { CLIMATIC_CATEGORY_ID } from './constants/climatic-event-ids'
import {
  CLIMATIC_ALERT_TYPES,
  CLIMATIC_CATEGORY_ICON,
} from './constants/climatic-events'
import { mapEnvironmentalIconToEventIds } from './constants/environmental-event-ids'
import { ENVIRONMENTAL_CATEGORY_ID } from './constants/environmental-event-ids'
import {
  ENVIRONMENTAL_ALERT_TYPES,
  ENVIRONMENTAL_CATEGORY_ICON,
} from './constants/environmental-events'
import { mapStructuralIconToEventIds } from './constants/structural-event-ids'
import { STRUCTURAL_CATEGORY_ID } from './constants/structural-event-ids'
import {
  STRUCTURAL_ALERT_TYPES,
  STRUCTURAL_CATEGORY_ICON,
} from './constants/structural-events'
import { RISK_OUTRO_ICON_ID, RISK_SITUATIONS } from './constants/risk-events'
import { mapHealthIconsToEventIds } from './constants/health-event-ids'
import { HEALTH_CATEGORY_ID } from './constants/health-event-ids'
import {
  HEALTH_CATEGORY_ICON,
  HEALTH_PAINS,
  HEALTH_SYMPTOMS,
} from './constants/health-symptoms'

const categories = [
  { icon: '1000', label: 'Saúde' },
  { icon: '1001', label: 'Climático' },
  { icon: '1002', label: 'Ambiental' },
  { icon: '1003', label: 'Estrutural' },
  { icon: '1007', label: 'Emergência' },
] as const

type Category = (typeof categories)[number]
const EMERGENCY_CATEGORY_ICON = '1007'

const CLIMATIC_LABEL_BY_ICON = new Map<string, string>(
  CLIMATIC_ALERT_TYPES.map((i) => [i.icon, i.label] as const),
)

const ENVIRONMENTAL_LABEL_BY_ICON = new Map<string, string>(
  ENVIRONMENTAL_ALERT_TYPES.map((i) => [i.icon, i.label] as const),
)

const STRUCTURAL_LABEL_BY_ICON = new Map<string, string>(
  STRUCTURAL_ALERT_TYPES.map((i) => [i.icon, i.label] as const),
)

const HEALTH_LABEL_BY_ICON = new Map<string, string>([
  ...HEALTH_SYMPTOMS.map((i) => [i.icon, i.label] as const),
  ...HEALTH_PAINS.map((i) => [i.icon, i.label] as const),
])

const RISK_LABEL_BY_ICON = new Map<string, string>(
  RISK_SITUATIONS.map((i) => [i.icon, i.label] as const),
)

function healthDescriptionFromIcons(iconIds: string[]) {
  return iconIds.map((id) => HEALTH_LABEL_BY_ICON.get(id) ?? id).join(', ')
}

function CategoryTile({
  c,
  isSelected,
  onPick,
}: {
  c: Category
  isSelected: boolean
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-1 rounded-[999px] px-1 py-1 focus:outline-none focus-visible:ring-0 sm:gap-2',
        isSelected && '',
      )}
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-full border border-transparent bg-[#F0F0F0] sm:size-16 sm:border-[#E5E7EB] md:size-[79.269px]">
        <img
          src={`/categories/${c.icon}.svg`}
          alt={c.label}
          title={c.label}
          className="max-h-full max-w-full object-contain object-center"
          width={45}
          height={40}
        />
      </div>
      <span className="text-center text-[11px] font-medium leading-tight text-foreground sm:text-sm">
        {c.label}
      </span>
    </button>
  )
}

export function RegisterNotification() {
  const { user } = useUser()
  const { isLocationOpen, setLocationOpen, location } = useMap()
  const [healthModalOpen, setHealthModalOpen] = useState(false)
  const [climaticModalOpen, setClimaticModalOpen] = useState(false)
  const [environmentalModalOpen, setEnvironmentalModalOpen] = useState(false)
  const [structuralModalOpen, setStructuralModalOpen] = useState(false)
  const [riskModalOpen, setRiskModalOpen] = useState(false)
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const [pendingClimaticAlert, setPendingClimaticAlert] = useState<{
    iconId: string
    optionalDescription: string
  } | null>(null)
  const [pendingEnvironmentalAlert, setPendingEnvironmentalAlert] = useState<{
    iconId: string
    optionalDescription: string
  } | null>(null)
  const [pendingStructuralAlert, setPendingStructuralAlert] = useState<{
    iconId: string
    optionalDescription: string
  } | null>(null)
  const [climaticRestoreDraft, setClimaticRestoreDraft] = useState<{
    iconId: string
    optionalDescription: string
  } | null>(null)
  const [environmentalRestoreDraft, setEnvironmentalRestoreDraft] = useState<{
    iconId: string
    optionalDescription: string
  } | null>(null)
  const [structuralRestoreDraft, setStructuralRestoreDraft] = useState<{
    iconId: string
    optionalDescription: string
  } | null>(null)
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState<
    string | null
  >(null)
  const submitHealthAlert = useCallback(
    async (iconIds: string[]) => {
      if (!user) {
        toastManager.add({
          title: 'Erro!',
          description: 'Usuário não autenticado.',
          type: 'error',
        })
        throw new Error('unauthenticated')
      }

      const eventIds = mapHealthIconsToEventIds(iconIds)
      if (eventIds.length === 0) {
        toastManager.add({
          title: 'Erro!',
          description:
            'Não foi possível mapear os sintomas para eventos da API.',
          type: 'error',
        })
        throw new Error('no-event-ids')
      }

      const description = healthDescriptionFromIcons(iconIds)

      const response = await fetch('/api/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
          description,
          authorId: user.id,
          communityId: user.communities[0].communityId,
          categoryId: HEALTH_CATEGORY_ID,
          eventIds,
          riskIds: [],
        }),
      })

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Não foi possível salvar o alerta (${response.status}).`,
        )
        toastManager.add({
          title: 'Erro!',
          description: message,
          type: 'error',
        })
        throw new Error('save-failed')
      }

      requestHealthAlertsRefresh()

      setHealthModalOpen(false)
      setSelectedCategoryIcon(null)
      setLocationOpen(false)

      toastManager.add({
        title: 'Sucesso',
        description: 'Alerta de saúde registrado.',
        type: 'success',
      })
    },
    [location.latitude, location.longitude, setLocationOpen, user],
  )

  const continueClimaticToRiskStep = useCallback(
    async (payload: { iconId: string; optionalDescription: string }) => {
      setPendingEnvironmentalAlert(null)
      setPendingStructuralAlert(null)
      setPendingClimaticAlert(payload)
      setClimaticModalOpen(false)
      setRiskModalOpen(true)
    },
    [],
  )

  const continueEnvironmentalToRiskStep = useCallback(
    async (payload: { iconId: string; optionalDescription: string }) => {
      setPendingClimaticAlert(null)
      setPendingStructuralAlert(null)
      setPendingEnvironmentalAlert(payload)
      setEnvironmentalModalOpen(false)
      setRiskModalOpen(true)
    },
    [],
  )

  const continueStructuralToRiskStep = useCallback(
    async (payload: { iconId: string; optionalDescription: string }) => {
      setPendingClimaticAlert(null)
      setPendingEnvironmentalAlert(null)
      setPendingStructuralAlert(payload)
      setStructuralModalOpen(false)
      setRiskModalOpen(true)
    },
    [],
  )

  const submitClimaticOrEnvironmentalAlertWithRisks = useCallback(
    async (riskPayload: {
      selectedIconIds: string[]
      optionalDescription: string
      riskIds: string[]
    }) => {
      if (!user) {
        toastManager.add({
          title: 'Erro!',
          description: 'Usuário não autenticado.',
          type: 'error',
        })
        throw new Error('unauthenticated')
      }

      const isClimatic = Boolean(pendingClimaticAlert)
      const isEnvironmental = Boolean(pendingEnvironmentalAlert)
      const isStructural = Boolean(pendingStructuralAlert)
      const pending =
        pendingClimaticAlert ??
        pendingEnvironmentalAlert ??
        pendingStructuralAlert

      if (!pending) {
        toastManager.add({
          title: 'Erro!',
          description: 'Dados do alerta não encontrados.',
          type: 'error',
        })
        throw new Error('no-pending-primary')
      }

      const primaryIds = isClimatic
        ? mapClimaticIconToEventIds(pending.iconId)
        : isEnvironmental
          ? mapEnvironmentalIconToEventIds(pending.iconId)
          : mapStructuralIconToEventIds(pending.iconId)

      if (primaryIds.length === 0) {
        toastManager.add({
          title: 'Erro!',
          description:
            'Não foi possível mapear o tipo de alerta para eventos da API.',
          type: 'error',
        })
        throw new Error('no-event-ids')
      }

      const eventIds = primaryIds
      const riskIds = riskPayload.riskIds
      const categoryId = isClimatic
        ? CLIMATIC_CATEGORY_ID
        : isEnvironmental
          ? ENVIRONMENTAL_CATEGORY_ID
          : STRUCTURAL_CATEGORY_ID

      const typeLabel = isClimatic
        ? (CLIMATIC_LABEL_BY_ICON.get(pending.iconId) ?? pending.iconId)
        : isEnvironmental
          ? (ENVIRONMENTAL_LABEL_BY_ICON.get(pending.iconId) ?? pending.iconId)
          : (STRUCTURAL_LABEL_BY_ICON.get(pending.iconId) ?? pending.iconId)

      let description = pending.optionalDescription
        ? `${typeLabel} — ${pending.optionalDescription}`
        : typeLabel

      if (riskPayload.selectedIconIds.length > 0) {
        const riskLabels = riskPayload.selectedIconIds.map(
          (id) => RISK_LABEL_BY_ICON.get(id) ?? id,
        )
        description += ` | Riscos: ${riskLabels.join(', ')}`
      }

      if (
        riskPayload.selectedIconIds.includes(RISK_OUTRO_ICON_ID) &&
        riskPayload.optionalDescription
      ) {
        description += ` — ${riskPayload.optionalDescription}`
      }

      const response = await fetch('/api/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
          description: description.length > 0 ? description : null,
          authorId: user.id,
          communityId: user.communities[0].communityId,
          categoryId,
          eventIds,
          riskIds,
        }),
      })

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          `Não foi possível salvar o alerta (${response.status}).`,
        )
        toastManager.add({
          title: 'Erro!',
          description: message,
          type: 'error',
        })
        throw new Error('save-failed')
      }

      if (riskPayload.selectedIconIds.length > 0 && riskIds.length === 0) {
        toastManager.add({
          title: 'Atenção',
          description:
            'Riscos selecionados não foram encontrados na API (GET /risks). O alerta foi salvo sem vínculo de riscos — cadastre os riscos ou verifique os nomes.',
          type: 'error',
          timeout: 8000,
        })
      }

      let createdAlertId: string | null = null
      try {
        const created = (await response.json()) as { id?: unknown }
        if (typeof created.id === 'string' && created.id.length > 0) {
          createdAlertId = created.id
        }
      } catch {
        // resposta sem JSON — pins/modal dependem do refresh
      }

      if (isClimatic) {
        requestClimaticAlertsRefresh()
      }
      if (isEnvironmental) {
        requestEnvironmentalAlertsRefresh()
      }
      if (isStructural) {
        requestStructuralAlertsRefresh()
      }

      setPendingClimaticAlert(null)
      setPendingEnvironmentalAlert(null)
      setPendingStructuralAlert(null)
      setRiskModalOpen(false)
      setClimaticModalOpen(false)
      setEnvironmentalModalOpen(false)
      setStructuralModalOpen(false)
      setSelectedCategoryIcon(null)
      setLocationOpen(false)

      toastManager.add({
        title: 'Sucesso.',
        description: 'Novo Alerta Cadastrado',
        type: 'success',
        timeout: 6000,
      })

      if (createdAlertId) {
        const id = createdAlertId
        window.setTimeout(() => {
          if (isClimatic) {
            dispatchClimaticAlertCreatedDetail({ alertId: id })
          }
          if (isEnvironmental) {
            dispatchEnvironmentalAlertCreatedDetail({ alertId: id })
          }
          if (isStructural) {
            dispatchStructuralAlertCreatedDetail({ alertId: id })
          }
        }, 3000)
      }
    },
    [
      location.latitude,
      location.longitude,
      pendingClimaticAlert,
      pendingEnvironmentalAlert,
      pendingStructuralAlert,
      setLocationOpen,
      user,
    ],
  )

  const handleRiskModalOpenChange = useCallback((open: boolean) => {
    setRiskModalOpen(open)
    if (!open) {
      setPendingClimaticAlert(null)
      setPendingEnvironmentalAlert(null)
      setPendingStructuralAlert(null)
    }
  }, [])

  const handleRiskBackToPrimary = useCallback(() => {
    if (pendingClimaticAlert) {
      setClimaticRestoreDraft(pendingClimaticAlert)
      setRiskModalOpen(false)
      setClimaticModalOpen(true)
      return
    }
    if (pendingEnvironmentalAlert) {
      setEnvironmentalRestoreDraft(pendingEnvironmentalAlert)
      setRiskModalOpen(false)
      setEnvironmentalModalOpen(true)
      return
    }
    if (pendingStructuralAlert) {
      setStructuralRestoreDraft(pendingStructuralAlert)
      setRiskModalOpen(false)
      setStructuralModalOpen(true)
    }
  }, [pendingClimaticAlert, pendingEnvironmentalAlert, pendingStructuralAlert])

  return (
    canCreateAlerts(user) && (
      <>
        <Dialog open={isLocationOpen} onOpenChange={setLocationOpen}>
          <DialogTrigger />

          <DialogContent
            className={`w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-b-2xl p-0 ${MAP_DIALOG_ANIMATION_CLASSES} sm:w-[480px] sm:max-w-[480px] sm:rounded-b-[18px]`}
            overlayClassName={MAP_DIALOG_ANIMATION_CLASSES}
          >
            <DialogHeader className="gap-0 border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 pb-6 pt-7 sm:border-0 sm:bg-[#FFFFFF] sm:px-5 sm:pb-4 sm:pt-5">
              <DialogTitle className="font-sans text-[20px] font-bold leading-none text-[#333]">
                Novo Alerta
              </DialogTitle>
              <DialogDescription className="hidden" />
            </DialogHeader>

            <div className="bg-[#FBFBFB] px-3 py-10 sm:bg-[#F8F8F8] sm:px-[18px] sm:py-10">
              <div className="grid w-full grid-cols-3 gap-x-6 gap-y-6 sm:gap-x-10 sm:gap-y-8">
                {categories.map((c) => {
                  const isHealth = c.icon === HEALTH_CATEGORY_ICON
                  const isClimatic = c.icon === CLIMATIC_CATEGORY_ICON
                  const isEnvironmental = c.icon === ENVIRONMENTAL_CATEGORY_ICON
                  const isStructural = c.icon === STRUCTURAL_CATEGORY_ICON
                  const isEmergency = c.icon === EMERGENCY_CATEGORY_ICON
                  return (
                    <CategoryTile
                      key={c.icon}
                      c={c}
                      isSelected={selectedCategoryIcon === c.icon}
                      onPick={() => {
                        setSelectedCategoryIcon(c.icon)
                        if (isHealth) setHealthModalOpen(true)
                        if (isClimatic) setClimaticModalOpen(true)
                        if (isEnvironmental) setEnvironmentalModalOpen(true)
                        if (isStructural) setStructuralModalOpen(true)
                        if (isEmergency) setEmergencyModalOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 flex h-[95px] min-h-[95px] w-full flex-row flex-nowrap items-center justify-between border-t border-[#E5E7EB] rounded-none bg-[#FFFFFF] px-3 py-0 sm:hidden">
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-[40.95px] min-h-[40.95px] w-[91px] min-w-[91px] gap-2 rounded-[20px] border-0 bg-[#FFFFFF] px-6 py-2 font-semibold text-[#1351B4] shadow-none hover:bg-[#F5F5F5] hover:opacity-100"
                  >
                    Voltar
                  </Button>
                }
              />
              <DialogClose
                render={
                  <Button
                    type="button"
                    className="h-[40.95px] min-h-[40.95px] w-[91px] min-w-[91px] gap-2 rounded-[20px] border-0 bg-[#1351B4] px-6 py-2 font-semibold text-[#FFFFFF] shadow-none hover:bg-[#0f3f8f] hover:opacity-100"
                  >
                    Salvar
                  </Button>
                }
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <HealthSymptomsDialog
          open={healthModalOpen}
          onOpenChange={setHealthModalOpen}
          onBack={() => setHealthModalOpen(false)}
          onConfirm={submitHealthAlert}
        />
        <ClimaticAlertDialog
          open={climaticModalOpen}
          onOpenChange={setClimaticModalOpen}
          onBack={() => setClimaticModalOpen(false)}
          onConfirm={continueClimaticToRiskStep}
          restoreDraft={climaticRestoreDraft}
          onRestoreDraftConsumed={() => setClimaticRestoreDraft(null)}
        />
        <EnvironmentalAlertDialog
          open={environmentalModalOpen}
          onOpenChange={setEnvironmentalModalOpen}
          onBack={() => setEnvironmentalModalOpen(false)}
          onConfirm={continueEnvironmentalToRiskStep}
          restoreDraft={environmentalRestoreDraft}
          onRestoreDraftConsumed={() => setEnvironmentalRestoreDraft(null)}
        />
        <StructuralAlertDialog
          open={structuralModalOpen}
          onOpenChange={setStructuralModalOpen}
          onBack={() => setStructuralModalOpen(false)}
          onConfirm={continueStructuralToRiskStep}
          restoreDraft={structuralRestoreDraft}
          onRestoreDraftConsumed={() => setStructuralRestoreDraft(null)}
        />
        <RiskAlertDialog
          open={riskModalOpen}
          onOpenChange={handleRiskModalOpenChange}
          onBack={handleRiskBackToPrimary}
          onConfirm={submitClimaticOrEnvironmentalAlertWithRisks}
        />
        <EmergencyServicesDialog
          open={emergencyModalOpen}
          onOpenChange={setEmergencyModalOpen}
          onBack={() => setEmergencyModalOpen(false)}
        />
      </>
    )
  )
}
