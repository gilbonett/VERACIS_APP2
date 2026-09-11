'use client'

import { Button } from '@/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import { toastManager } from '@/components/toast'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { getApiErrorMessage } from '@/http/parse-api-error-message'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MAP_DIALOG_ANIMATION_CLASSES } from '../constants/dialog-animation'
import {
  HEALTH_CATEGORY_ICON,
  HEALTH_COMMENTS_BADGE_ICON,
  HEALTH_COMMENTS_CHEVRON_ICON,
  HEALTH_COMMENT_SEND_ICON,
  HEALTH_ICON_BASE,
} from '../constants/health-symptoms'
import {
  formatDistanceLabelPt,
  formatShortTimeAgoPt,
} from '../utils/health-alert-meta'

export type HealthAlertSymptomItem = {
  eventId: string
  iconSlug: string
  label: string
}

export type HealthAlertDetailData = {
  id: string
  lat: number
  lng: number
  createdAt: string
  description: string | null | undefined
  commentsCount: number
  symptoms: HealthAlertSymptomItem[]
  pendingClosure: boolean
}

type HealthAlertCommentItem = {
  commentId: string
  content: string
  createdAt: string
  authorId: string
  authorName: string
}

type HealthAlertDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: HealthAlertDetailData | null
  refLat?: number
  refLng?: number
  onFinalized?: (alertId: string) => void
}

export function HealthAlertDetailDialog({
  open,
  onOpenChange,
  alert,
  refLat,
  refLng,
  onFinalized,
}: HealthAlertDetailDialogProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isSubmittingFinalize, setIsSubmittingFinalize] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<HealthAlertCommentItem[]>([])
  const currentAlertIdRef = useRef<string | null>(null)

  const loadAlertComments = useCallback(async () => {
    if (!alert) return
    if (currentAlertIdRef.current !== alert.id) {
      currentAlertIdRef.current = alert.id
      setComments([])
    }
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        setComments([])
        return
      }

      const payload = (await response.json()) as {
        comments?: HealthAlertCommentItem[]
      }
      setComments(Array.isArray(payload.comments) ? payload.comments : [])
    } catch {
      setComments([])
    } finally {
      setIsLoadingComments(false)
    }
  }, [alert])

  async function submitFinalize() {
    if (!alert || alert.pendingClosure) return
    setIsSubmittingFinalize(true)
    try {
      try {
        await fetch(`/api/alerts/${alert.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ closed: true }),
        })
      } catch {
        /** */
      }

      toastManager.add({
        title: 'Alerta Finalizado com Sucesso',
        type: 'success',
      })
      onFinalized?.(alert.id)
      onOpenChange(false)
    } finally {
      setIsSubmittingFinalize(false)
    }
  }

  async function submitComment() {
    if (!alert) return
    if (alert.pendingClosure) return
    const content = commentText.trim()
    if (!content) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch('/api/alerts/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: alert.id,
          content,
        }),
      })

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          'Não foi possível enviar o comentário.',
        )
        toastManager.add({
          title: 'Erro!',
          description: message,
          type: 'error',
        })
        return
      }

      setCommentText('')
      await loadAlertComments()
    } finally {
      setIsSubmittingComment(false)
    }
  }

  useEffect(() => {
    if (!open) {
      setCommentText('')
      setIsSubmittingFinalize(false)
      return
    }
    setIsCommentsOpen(false)
    void loadAlertComments()
  }, [loadAlertComments, open])

  const distanceOk =
    alert &&
    refLat !== undefined &&
    refLng !== undefined &&
    !Number.isNaN(refLat) &&
    !Number.isNaN(refLng)

  const distanceLabel =
    distanceOk && alert
      ? formatDistanceLabelPt(refLat, refLng, alert.lat, alert.lng)
      : null

  const timeLabel = alert ? formatShortTimeAgoPt(alert.createdAt) : ''

  const badgeParts = [distanceLabel, timeLabel].filter(Boolean)
  const isCommentingDisabled = Boolean(alert?.pendingClosure || isSubmittingComment)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          'max-h-[min(90vh,720px)] w-full max-w-[calc(100%-2rem)] gap-0 overflow-y-auto overflow-x-hidden rounded-[18px] p-0 opacity-100 [-ms-overflow-style:none] [scrollbar-width:none] sm:w-[480px] sm:max-w-[480px] sm:min-h-[216px] [&::-webkit-scrollbar]:hidden',
          MAP_DIALOG_ANIMATION_CLASSES,
        )}
        overlayClassName={MAP_DIALOG_ANIMATION_CLASSES}
      >
        {alert ? (
          <>
            <DialogHeader className="gap-3 px-4 pb-4 pt-5 sm:px-5">
              <div className="flex items-start gap-3 pr-8">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#F0F0F0] sm:size-14">
                  <img
                    src={`/categories/${HEALTH_CATEGORY_ICON}.svg`}
                    alt=""
                    title="Saúde"
                    className="max-h-[85%] max-w-[85%] object-contain object-center"
                    width={45}
                    height={40}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <DialogTitle className="text-left text-lg font-bold leading-tight text-[#333]">
                    Alerta de Saúde
                  </DialogTitle>
                  {badgeParts.length > 0 ? (
                    <p className="inline-flex w-fit max-w-full rounded-full bg-[#F0F0F0] px-2.5 py-1 text-xs font-medium text-[#666]">
                      {badgeParts.join(' • ')}
                    </p>
                  ) : null}
                </div>
              </div>
              <DialogDescription className="sr-only">
                Detalhes do alerta de saúde registrado no mapa.
              </DialogDescription>
            </DialogHeader>

            <div className="px-4 py-4 sm:px-5">
              {alert.symptoms.length > 0 ? (
                <div>
                  <p id="health-alert-symptoms-a11y" className="sr-only">
                    Sintomas relatados:{' '}
                    {alert.symptoms.map((s) => s.label).join(', ')}.
                  </p>
                  <div
                    role="list"
                    aria-labelledby="health-alert-symptoms-a11y"
                    className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-x-4 sm:gap-y-4"
                  >
                    {alert.symptoms.map((s) => (
                      <div
                        key={s.eventId}
                        role="listitem"
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="grid size-14 shrink-0 place-items-center rounded-full border border-[#E5E7EB] bg-[#F0F0F0] sm:size-16"
                          aria-hidden
                        >
                          <img
                            src={`${HEALTH_ICON_BASE}/${s.iconSlug}.svg`}
                            alt=""
                            width={45}
                            height={40}
                            className="max-h-[85%] max-w-[85%] object-contain object-center"
                          />
                        </div>
                        <span className="text-center text-[10px] font-medium leading-tight text-[#333]">
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : alert.description?.trim() ? (
                <p className="text-sm leading-relaxed text-[#333]">
                  <span className="font-semibold text-[#555]">Sintomas: </span>
                  {alert.description}
                </p>
              ) : null}

              <div
                className={cn(
                  'flex gap-3 rounded-xl bg-[#E8F4FC] px-3 py-3 text-sm text-[#1351B4]',
                  (alert.symptoms.length > 0 || alert.description?.trim()) &&
                    'mt-4',
                )}
              >
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 stroke-[#1351B4]"
                  strokeWidth={2}
                  aria-hidden
                />
                <p className="leading-snug">
                  <strong className="font-semibold">
                    Em caso de urgência médica,
                  </strong>{' '}
                  procure imediatamente um serviço de saúde ou atendimento
                  médico.
                </p>
              </div>
            </div>

            <div
              className="flex w-full flex-row flex-nowrap items-center gap-3 bg-white px-4 pt-4 pb-3 sm:px-5"
              role="group"
              aria-label="Comentários do alerta"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Comentários do alerta (${comments.length > 0 ? comments.length : alert.commentsCount})`}
                  className="box-border flex h-8 w-[58px] shrink-0 items-center justify-center gap-2 rounded-full border-0 bg-[#1351B4] p-0 text-white opacity-100 shadow-none hover:bg-[#0f3f8f] hover:text-white"
                  onClick={() => {
                    setIsCommentsOpen((prev) => !prev)
                  }}
                >
                  <img
                    src={`${HEALTH_ICON_BASE}/${HEALTH_COMMENTS_BADGE_ICON}.svg`}
                    alt=""
                    width={16}
                    height={16}
                    className="pointer-events-none size-4 max-h-4 max-w-4 shrink-0 object-contain"
                    aria-hidden
                  />
                  <span className="text-sm font-semibold tabular-nums leading-none">
                    {comments.length > 0
                      ? comments.length
                      : alert.commentsCount}
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => setIsCommentsOpen((prev) => !prev)}
                  className="flex shrink-0 items-center gap-1 text-left opacity-100"
                  aria-expanded={isCommentsOpen}
                >
                  <span className="whitespace-nowrap font-sans text-sm font-extrabold leading-none tracking-normal text-[#1351B4]">
                    Comentários ({' '}
                    {comments.length > 0
                      ? comments.length
                      : alert.commentsCount}{' '}
                    )
                  </span>
                  <img
                    src={`${HEALTH_ICON_BASE}/${HEALTH_COMMENTS_CHEVRON_ICON}.svg`}
                    alt=""
                    aria-hidden
                    className={cn(
                      'inline-block size-4 shrink-0 object-contain object-center leading-none tracking-normal transition-transform',
                      isCommentsOpen ? 'rotate-0' : 'rotate-180',
                    )}
                  />
                </button>
              </div>
            </div>

            {isCommentsOpen ? (
              <div className="px-4 pb-0 sm:px-5">
                {isLoadingComments ? (
                  <div className="rounded-lg bg-[#F5F5F5] px-4 py-3 text-sm text-[#666]">
                    Carregando comentários...
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.commentId}
                        className="rounded-lg bg-[#F5F5F5] px-4 py-3 text-[#333]"
                      >
                        <p className="text-justify text-[12px] leading-[100%] [font-family:Rawline]">
                          <span className="font-semibold text-[#1351B4]">
                            Anônimo:
                          </span>{' '}
                          <span className="font-normal text-[#1351B4]/90">
                            {comment.content}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[#666]">
                          {formatShortTimeAgoPt(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-[#F5F5F5] px-4 py-3 text-sm text-[#666]">
                    Ainda não há comentários neste alerta.
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void submitComment()
                      }
                    }}
                    placeholder={
                      alert.pendingClosure
                        ? 'Alerta encerrado. Comentários desativados.'
                        : 'Deixe seu comentário...'
                    }
                    className="h-11 w-full rounded-md border border-[#E5E7EB] bg-[#F8F8F8] px-4 text-sm text-[#333] outline-none focus:border-[#1351B4]"
                    disabled={isCommentingDisabled}
                  />
                  <button
                    type="button"
                    aria-label="Enviar comentário"
                    className="grid size-11 shrink-0 place-items-center rounded-full border-0 bg-[#1351B4] text-white transition-colors hover:bg-[#0f3f8f] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isCommentingDisabled || !commentText.trim()}
                    onClick={() => {
                      void submitComment()
                    }}
                  >
                    <img
                      src={`${HEALTH_ICON_BASE}/${HEALTH_COMMENT_SEND_ICON}.svg`}
                      alt=""
                      aria-hidden
                      className="h-8 w-8 max-h-full max-w-full object-contain object-center"
                    />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end rounded-b-[18px] bg-white px-4 pb-4 pt-3 sm:px-5">
              {alert.pendingClosure ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled
                  className="box-border flex h-8 min-w-[130px] shrink-0 cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-[20px] border-0 bg-[#E5E7EB] px-6 py-0 text-xs font-semibold leading-none text-[#555] opacity-100 shadow-none hover:bg-[#E5E7EB] hover:text-[#555]"
                >
                  Alerta encerrado
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmittingFinalize}
                  className="box-border flex h-8 w-[130px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[20px] border-0 bg-[#1351B4] px-6 py-0 text-xs font-semibold leading-none text-white opacity-100 shadow-none hover:bg-[#0f3f8f] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    void submitFinalize()
                  }}
                >
                  {isSubmittingFinalize ? 'A finalizar…' : 'Finalizar Alerta'}
                </Button>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
