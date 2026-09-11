'use client'

import { Textarea } from '@/components/textarea'
import { useUser } from '@/contexts/user-context'
import { normalizeAlertAttachmentUrlForBrowser } from '@/http/alert-attachment-url'
import {
  getApiErrorMessage,
  isAlertReactionAlreadyExistsMessage,
} from '@/http/parse-api-error-message'
import { uploadAlertAttachmentFiles } from '@/http/upload-alert-attachments'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog'
import { toastManager } from '@/components/toast'
import { cn } from '@/lib/utils'
import { AlertTriangle, ImageIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAP_DIALOG_ANIMATION_CLASSES } from '../constants/dialog-animation'
import {

  getAlertVerificationUi,
  MAP_ALERT_VERIFIED_BADGE_ICON_SRC,
  type MapAlertHttpStatus,
  parseMapAlertStatus,
  shouldShowCommunityProximityActions,
} from '../constants/alert-verification'
import {
  useProximityBannerDismissedStorage,
  useTestLikeBoostSession,
} from '../hooks/use-map-alert-proximity-and-test-boost'
import { useCommunityProximityReady } from '../hooks/use-community-proximity-ready'
import { requestStructuralAlertsRefresh } from '../constants/health-alerts-refresh'
import {
  HEALTH_COMMENTS_BADGE_ICON,
  HEALTH_COMMENTS_SECTION_ICON,
  HEALTH_COMMENT_SEND_ICON,
  HEALTH_ICON_BASE,
} from '../constants/health-symptoms'
import { ImageLightbox } from './image-lightbox'
import { RiskAlertDialog } from './risk-alert-dialog'
import {
  CLIMATIC_COMMUNITY_DISLIKE_BANNER_ICON_ID,
  CLIMATIC_COMMUNITY_DISLIKE_ICON_ID,
  CLIMATIC_COMMUNITY_LIKE_ICON_ID,
  CLIMATIC_ICON_BASE,
} from '../constants/climatic-events'
import {
  STRUCTURAL_ICON_BASE,
  STRUCTURAL_SAFETY_BANNER_LINES,
} from '../constants/structural-events'
import { RISK_SITUATIONS } from '../constants/risk-events'
import {
  formatDistanceLabelPt,
  formatShortTimeAgoPt,
} from '../utils/health-alert-meta'

export type StructuralAlertDetailData = {
  id: string
  lat: number
  lng: number
  createdAt: string
  description: string | null | undefined
  title: string
  iconSlug: string
  hasAttachments: boolean
  status?: MapAlertHttpStatus
  openWithImageComposer?: boolean
}

const VALIDATION_BADGE_LEFT = 'Aguardando validação'

type StructuralAlertCommentItem = {
  commentId: string
  content: string
  createdAt: string
  authorId: string
  authorName: string
}

type StructuralAlertDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: StructuralAlertDetailData | null
  refLat?: number
  refLng?: number
}

export function StructuralAlertDetailDialog({
  open,
  onOpenChange,
  alert,
  refLat,
  refLng,
}: StructuralAlertDetailDialogProps) {
  const { user } = useUser()
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([])
  const [serverAttachmentUrls, setServerAttachmentUrls] = useState<string[]>([])
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [dislikesCount, setDislikesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)
  const [currentUserReaction, setCurrentUserReaction] = useState<
    'LIKE' | 'DISLIKE' | null
  >(null)
  const [alertStatus, setAlertStatus] = useState<MapAlertHttpStatus>('PENDING')
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false)
  const [communityPromptDismissed, setCommunityPromptDismissed] =
    useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { proximityBannerDismissedStorage, markProximityBannerDismissed } =
    useProximityBannerDismissedStorage(open, alert?.id, user?.id)
  const { testLikeBoost } = useTestLikeBoostSession(
    open,
    alert?.id,
    likesCount,
  )

  const communityProximityReady = useCommunityProximityReady(
    open,
    alert?.id,
    alert?.createdAt,
  )
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{
    isDown: boolean
    startX: number
    startScrollLeft: number
    didDrag: boolean
  }>({ isDown: false, startX: 0, startScrollLeft: 0, didDrag: false })

  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<StructuralAlertCommentItem[]>([])
  const commentsAlertIdRef = useRef<string | null>(null)
  const commentsListScrollRef = useRef<HTMLDivElement | null>(null)

  const loadAlertComments = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false
      if (!alert) return
      if (commentsAlertIdRef.current !== alert.id) {
        commentsAlertIdRef.current = alert.id
        setComments([])
      }
      if (!silent) setIsLoadingComments(true)
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
          comments?: StructuralAlertCommentItem[]
          commentsCount?: number
        }
        const list = Array.isArray(payload.comments) ? payload.comments : []
        setComments(list)
        if (
          typeof payload.commentsCount === 'number' &&
          !Number.isNaN(payload.commentsCount)
        ) {
          setCommentsCount(payload.commentsCount)
        } else {
          setCommentsCount(list.length)
        }
      } catch {
        setComments([])
      } finally {
        if (!silent) setIsLoadingComments(false)
      }
    },
    [alert],
  )

  async function submitComment() {
    if (!alert) return
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
          title: 'Erro',
          description: message,
          type: 'error',
        })
        return
      }

      setCommentText('')
      await loadAlertComments({ silent: true })
      requestAnimationFrame(() => {
        const el = commentsListScrollRef.current
        if (el) el.scrollTop = 0
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  useEffect(() => {
    return () => {
      for (const url of selectedImageUrls) {
        URL.revokeObjectURL(url)
      }
    }
  }, [selectedImageUrls])

  const loadAlertDetail = useCallback(async () => {
    if (!alert) return
    setIsLoadingAttachments(true)
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        setServerAttachmentUrls([])
        setLikesCount(0)
        setDislikesCount(0)
        setCommentsCount(0)
        setCurrentUserReaction(null)
        setAlertStatus('PENDING')
        return
      }
      const payload = (await res.json()) as {
        status?: unknown
        attachments?: { url?: string | null }[]
        reactions?: { LIKE?: number; DISLIKE?: number }
        commentsCount?: number
        currentUserReaction?: 'LIKE' | 'DISLIKE' | null
      }
      setAlertStatus(parseMapAlertStatus(payload.status))
      const urls = (payload.attachments ?? [])
        .map((a) => a.url)
        .filter(
          (u): u is string => typeof u === 'string' && u.trim().length > 0,
        )
        .map((u) => normalizeAlertAttachmentUrlForBrowser(u))
      setServerAttachmentUrls(urls)
      const r = payload.reactions ?? {}
      setLikesCount(
        typeof r.LIKE === 'number' && !Number.isNaN(r.LIKE) ? r.LIKE : 0,
      )
      setDislikesCount(
        typeof r.DISLIKE === 'number' && !Number.isNaN(r.DISLIKE)
          ? r.DISLIKE
          : 0,
      )
      setCommentsCount(
        typeof payload.commentsCount === 'number' &&
          !Number.isNaN(payload.commentsCount)
          ? payload.commentsCount
          : 0,
      )
      const cur = payload.currentUserReaction
      const nextReaction = cur === 'LIKE' || cur === 'DISLIKE' ? cur : null
      setCurrentUserReaction(nextReaction)
      if (nextReaction) markProximityBannerDismissed()
    } catch {
      setServerAttachmentUrls([])
      setLikesCount(0)
      setDislikesCount(0)
      setCommentsCount(0)
      setCurrentUserReaction(null)
      setAlertStatus('PENDING')
    } finally {
      setIsLoadingAttachments(false)
    }
  }, [alert, markProximityBannerDismissed])

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!alert || files.length === 0) return
      setIsUploading(true)
      try {
        const result = await uploadAlertAttachmentFiles(alert.id, files)
        if (!result.ok) {
          toastManager.add({
            title: 'Erro',
            description: result.message,
            type: 'error',
          })
          return
        }
        toastManager.add({
          title: 'Sucesso',
          description:
            files.length === 1
              ? 'Imagem enviada com sucesso.'
              : `${files.length} imagens enviadas com sucesso.`,
          type: 'success',
        })
        setSelectedImageUrls((prev) => {
          for (const u of prev) URL.revokeObjectURL(u)
          return []
        })
        await loadAlertDetail()
        requestStructuralAlertsRefresh()
      } finally {
        setIsUploading(false)
      }
    },
    [alert, loadAlertDetail],
  )

  async function setImagesFromFileList(files: FileList | null) {
    const nextFiles = files ? Array.from(files) : []
    if (nextFiles.length === 0) return
    const urls = nextFiles.map((f) => URL.createObjectURL(f))
    setSelectedImageUrls((prev) => {
      for (const url of prev) URL.revokeObjectURL(url)
      return urls
    })
    await uploadFiles(nextFiles)
  }

  useEffect(() => {
    if (!open || !alert) return
    setCommunityPromptDismissed(false)
    setAlertStatus(parseMapAlertStatus(alert.status))
    setIsLoadingAttachments(true)
    void loadAlertDetail()
  }, [open, alert?.id, alert?.status, loadAlertDetail])

  useEffect(() => {
    if (open) return
    setServerAttachmentUrls([])
    setLikesCount(0)
    setDislikesCount(0)
    setCommentsCount(0)
    setCurrentUserReaction(null)
    setAlertStatus('PENDING')
    setCommunityPromptDismissed(false)
    setIsCommentsOpen(false)
    setCommentText('')
    setComments([])
    commentsAlertIdRef.current = null
    setSelectedImageUrls((prev) => {
      for (const u of prev) URL.revokeObjectURL(u)
      return []
    })
  }, [open])

  useEffect(() => {
    if (!open || !isCommentsOpen || !alert) return
    void loadAlertComments()
  }, [open, isCommentsOpen, alert?.id, loadAlertComments])

  const submitCommunityReaction = useCallback(
    async (type: 'LIKE' | 'DISLIKE') => {
      if (!alert || currentUserReaction !== null) return
      setIsSubmittingReaction(true)
      try {
        const res = await fetch('/api/alerts/reactions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId: alert.id, type }),
        })
        if (!res.ok) {
          const message = await getApiErrorMessage(
            res,
            'Não foi possível registrar sua resposta.',
          )
          if (isAlertReactionAlreadyExistsMessage(message)) {
            markProximityBannerDismissed()
            setCommunityPromptDismissed(true)
            await loadAlertDetail()
            setCurrentUserReaction((prev) => prev ?? type)
            requestStructuralAlertsRefresh()
            return
          }
          toastManager.add({
            title: 'Erro',
            description: message,
            type: 'error',
          })
          return
        }
        setCurrentUserReaction(type)
        setCommunityPromptDismissed(true)
        markProximityBannerDismissed()
        await loadAlertDetail()
        requestStructuralAlertsRefresh()
      } finally {
        setIsSubmittingReaction(false)
      }
    },
    [alert, currentUserReaction, loadAlertDetail, markProximityBannerDismissed],
  )

  function extractRiskOnly(
    description: string | null | undefined,
  ): string | null {
    const raw = typeof description === 'string' ? description.trim() : ''
    if (!raw) return null
    const m = raw.match(/(?:^|\|)\s*Riscos:\s*(.+)$/i)
    const risk = m?.[1]?.trim()
    return risk ? risk : null
  }

  function splitLeadingValue(label: string): { value: string; rest: string } {
    const trimmed = label.trim()
    const firstSpace = trimmed.indexOf(' ')
    if (firstSpace === -1) return { value: trimmed, rest: '' }
    return {
      value: trimmed.slice(0, firstSpace),
      rest: trimmed.slice(firstSpace),
    }
  }

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
  const metaBadgeOk = Boolean(distanceLabel && timeLabel)

  const initialRiskOnly = alert ? extractRiskOnly(alert.description) : null
  const [riskText, setRiskText] = useState<string | null>(initialRiskOnly)
  const [riskModalOpen, setRiskModalOpen] = useState(false)
  const hasRisk = Boolean(riskText)

  const displayImageUrls = useMemo(
    () => [...serverAttachmentUrls, ...selectedImageUrls],
    [serverAttachmentUrls, selectedImageUrls],
  )
  const hasImages = displayImageUrls.length > 0
  const emptyImageComposerMode =
    Boolean(alert?.openWithImageComposer) && !hasImages
  const showCommunityProximityBanner =
    distanceOk &&
    !communityPromptDismissed &&
    !proximityBannerDismissedStorage &&
    !emptyImageComposerMode &&
    communityProximityReady &&
    shouldShowCommunityProximityActions({
      alertStatus,
      currentUserReaction,
    }) &&
    !isLoadingAttachments

  useEffect(() => {
    if (!hasImages && emptyImageComposerMode) setIsCommentsOpen(false)
  }, [hasImages, emptyImageComposerMode])

  useEffect(() => {
    setRiskText(initialRiskOnly)
  }, [initialRiskOnly])

  const RISK_ICON_BY_LABEL = new Map<string, string>(
    RISK_SITUATIONS.map((r) => [r.label.toLowerCase(), r.icon] as const),
  )

  const initialRiskIcons = riskText
    ? riskText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((label) => RISK_ICON_BY_LABEL.get(label.toLowerCase()))
        .filter((v): v is string => Boolean(v))
    : []

  const { validationProgressLabel, isVerifiedUi, displayLikes } =
    getAlertVerificationUi({
      likesCount,
      testLikeBoost,
      alertStatus,
    })

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[calc(100vh-2rem)] min-h-0 w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden gap-0 rounded-[18px] bg-white p-0 opacity-100 sm:min-h-[403px] sm:w-[480px] sm:max-w-[480px]',
          isVerifiedUi && 'border-t-[4px] border-[#F5C542] sm:border-t-[4px]',
          MAP_DIALOG_ANIMATION_CLASSES,
        )}
        overlayClassName={MAP_DIALOG_ANIMATION_CLASSES}
      >
        {alert ? (
          <>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void setImagesFromFileList(e.target.files)
                e.target.value = ''
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                void setImagesFromFileList(e.target.files)
                e.target.value = ''
              }}
            />
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
              <DialogHeader className="shrink-0 gap-3 p-0">
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => onOpenChange(false)}
                  className="absolute right-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full text-[#333333] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]/30 sm:right-5 sm:top-5"
                >
                  <span
                    className="fas fa-times text-[16px] leading-none"
                    aria-hidden
                  />
                </button>

                {showCommunityProximityBanner ? (
                  <div
                    className={cn(
                      'relative z-10 flex min-h-[208px] w-full max-w-[480px] shrink-0 flex-col rounded-t-[16px]',
                      'bg-[linear-gradient(178.27deg,rgba(211,235,255,0.22)_2.03%,rgba(211,235,255,0.22)_38.44%,rgba(80,175,255,0.22)_99.12%)]',
                    )}
                  >
                    <div className="flex h-full flex-col gap-5 px-4 pb-4 pt-12 sm:gap-6 sm:px-5 sm:pt-14">
                      <div className="flex flex-col gap-2">
                        <p className="flex min-h-[25px] max-w-[319px] items-center text-[18px] font-bold leading-[100%] tracking-normal text-[#1351B4] [font-family:Rawline]">
                          Você está próximo a esse alerta!
                        </p>
                        <p className="flex min-h-[21px] max-w-[319px] items-center text-[15px] font-medium leading-[100%] tracking-normal text-[#1351B4] [font-family:Rawline]">
                          Ajude a comunidade confirmando:
                        </p>
                        <p className="flex min-h-[21px] max-w-[319px] items-center text-[15px] font-medium leading-[100%] tracking-normal text-[#1351B4] [font-family:Rawline]">
                          o evento abaixo ainda está acontecendo?
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          className="inline-flex h-[39px] shrink-0 items-center justify-center gap-2 rounded-[20px] bg-[rgba(211,235,255,0.35)] px-3 py-2 text-[14px] font-semibold leading-[100%] tracking-normal text-[#1351B4] transition-colors [font-family:Rawline] hover:bg-[rgba(211,235,255,0.55)] sm:px-6"
                          onClick={() => {
                            setCommunityPromptDismissed(true)
                            markProximityBannerDismissed()
                          }}
                        >
                          Não Sei
                        </button>
                        <button
                          type="button"
                          disabled={
                            isSubmittingReaction || currentUserReaction !== null
                          }
                          className={cn(
                            'box-border inline-flex h-[39px] shrink-0 items-center justify-center gap-2 rounded-[20px] border border-[#1351B4] bg-[#FFFFFF] px-3 py-2 text-[14px] font-semibold leading-[100%] tracking-normal text-[#1351B4] transition-colors [font-family:Rawline] disabled:opacity-50 sm:px-6',
                            currentUserReaction === 'DISLIKE' &&
                              'bg-[rgba(211,235,255,0.35)]',
                          )}
                          onClick={() =>
                            void submitCommunityReaction('DISLIKE')
                          }
                        >
                          <img
                            src={`${CLIMATIC_ICON_BASE}/${CLIMATIC_COMMUNITY_DISLIKE_BANNER_ICON_ID}.svg`}
                            alt=""
                            aria-hidden
                            className="pointer-events-none size-[21px] shrink-0 object-contain"
                          />
                          Não
                        </button>
                        <button
                          type="button"
                          disabled={
                            isSubmittingReaction || currentUserReaction !== null
                          }
                          className={cn(
                            'box-border inline-flex h-[39px] shrink-0 items-center justify-center gap-2 rounded-[20px] bg-[#1351B4] px-3 py-2 text-[14px] font-semibold leading-[100%] tracking-normal text-white transition-colors [font-family:Rawline] hover:bg-[#0f3f8f] disabled:opacity-50 sm:px-6',
                            currentUserReaction === 'LIKE' &&
                              'ring-2 ring-inset ring-white/45',
                          )}
                          onClick={() => void submitCommunityReaction('LIKE')}
                        >
                          <img
                            src={`${CLIMATIC_ICON_BASE}/${CLIMATIC_COMMUNITY_LIKE_ICON_ID}.svg`}
                            alt=""
                            aria-hidden
                            className="pointer-events-none size-[21px] shrink-0 object-contain"
                          />
                          Sim
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div
                  className={cn(
                    'flex items-start gap-3 px-4 pb-4 sm:px-5',
                    showCommunityProximityBanner ? 'pt-3' : 'pt-5',
                  )}
                >
                  <div className="grid h-[37px] w-[37px] shrink-0 place-items-center rounded-[73px] border-2 border-white bg-[#F4F4F4]">
                    <img
                      src={`${STRUCTURAL_ICON_BASE}/${alert.iconSlug}.svg`}
                      alt=""
                      title={alert.title}
                      className="pointer-events-none max-h-[85%] max-w-[85%] object-contain object-center"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-left font-sans text-[20px] font-bold leading-[18px] text-[#333333]">
                      {alert.title}
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="sr-only">
                  Detalhes do alerta estrutural registrado no mapa.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(19,81,180,0.25)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(19,81,180,0.25)]">
                <div className="px-4 pb-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
                  <div className="mt-3 flex flex-nowrap items-center gap-1.5 sm:gap-2">
                    {isVerifiedUi ? (
                      <span className="inline-flex min-h-[22px] min-w-0 shrink items-center gap-1.5 rounded-[23.5px] bg-[#FFF7EB] px-2 py-0.5 font-sans text-[11px] leading-[1.15] text-[#333333] sm:min-h-[25px] sm:gap-2 sm:px-2.5 sm:text-[12px] sm:leading-[12px] md:px-3">
                        <img
                          src={MAP_ALERT_VERIFIED_BADGE_ICON_SRC}
                          alt=""
                          aria-hidden
                          className="pointer-events-none size-5 shrink-0 object-contain -ml-2.5 sm:size-[22px] sm:-ml-3 md:size-[24.909px] md:-ml-2.5 lg:-ml-2"
                        />
                        <span className="min-w-0 shrink truncate font-bold">
                          Alerta Verificado
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex h-[25px] min-w-0 shrink items-center gap-1 rounded-[23.5px] bg-[#F4F4F4] px-2 font-sans text-[11px] leading-[12px] text-[#333333] sm:gap-2 sm:px-2.5 sm:text-[12px]">
                        <span className="shrink-0 font-bold">
                          {VALIDATION_BADGE_LEFT}
                        </span>
                        <span
                          aria-hidden
                          className="h-[3px] w-[3px] shrink-0 rounded-[2px] bg-[#BEBEBE]"
                        />
                        <span className="shrink-0 font-medium tabular-nums">
                          {validationProgressLabel}
                        </span>
                      </span>
                    )}
                    {metaBadgeOk && distanceLabel ? (
                      <span
                        className={cn(
                          'inline-flex h-[25px] min-w-0 shrink items-center gap-1 whitespace-nowrap rounded-[23.5px] px-2 font-sans text-[11px] font-bold leading-[12px] sm:gap-2 sm:px-3 sm:text-[12px]',
                          isVerifiedUi
                            ? 'bg-[#FFF7EB] text-[#333333]'
                            : 'bg-[#F4F4F4] text-[#848484]',
                        )}
                      >
                        <span className="whitespace-nowrap">
                          <span className="font-semibold">
                            {splitLeadingValue(distanceLabel).value}
                          </span>
                          {splitLeadingValue(distanceLabel).rest}
                        </span>
                        <span
                          aria-hidden
                          className="h-[3px] w-[3px] shrink-0 rounded-[2px] bg-[#BEBEBE]"
                        />
                        <span className="shrink-0 font-bold">{timeLabel}</span>
                      </span>
                    ) : null}
                  </div>

                  {riskText ? (
                    <p className="mt-3 text-sm leading-relaxed text-[#333]">
                      <span className="text-[#666]">Riscos: </span>
                      <strong className="font-bold">{riskText}</strong>
                    </p>
                  ) : null}

                  <div
                    className={cn(
                      'box-border -mx-4 flex min-h-0 w-[calc(100%+2rem)] max-w-[calc(100%+2rem)] flex-col overflow-hidden rounded-b-[18px] bg-[#F8F8F8]/64 sm:-mx-5 sm:w-[480px] sm:max-w-[480px]',
                      hasRisk ? 'mt-3' : 'mt-4',
                    )}
                  >
                    {!emptyImageComposerMode &&
                    !showCommunityProximityBanner ? (
                      <div className="box-border hidden h-[67px] w-full shrink-0 items-center gap-[25px] border-0 bg-[#D3EBFF]/40 px-5 sm:flex">
                        <AlertTriangle
                          className="size-[24px] shrink-0 stroke-[#1351B4]"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <p className="flex max-w-[319px] min-w-0 flex-col gap-1.5 text-[12px] tracking-normal text-[#1351B4] [font-family:Rawline]">
                          <span className="font-semibold leading-[100%]">
                            {STRUCTURAL_SAFETY_BANNER_LINES[0]}
                          </span>
                          <strong className="m-0 font-bold leading-[100%] tracking-normal [font-family:Rawline]">
                            {STRUCTURAL_SAFETY_BANNER_LINES[1]}
                          </strong>
                        </p>
                      </div>
                    ) : null}

                    <div className="w-full shrink-0 px-4 sm:px-5">
                      {!hasImages && (
                        <p className="mt-2 font-sans text-[13px] font-bold leading-[16px] text-[#333333]">
                          Mostre o que está acontecendo no local:
                        </p>
                      )}
                      <div
                        className={cn(
                          'mt-2 flex h-[146px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed border-[#9F9C9B]/[0.46] bg-[#F8F8F8] px-4 text-center',
                          displayImageUrls.length > 0 && 'px-0',
                          displayImageUrls.length > 0 && 'h-[147px]',
                        )}
                      >
                        {isLoadingAttachments &&
                        displayImageUrls.length === 0 ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1351B4] border-t-transparent" />
                            <p className="font-sans text-[12px] text-[#848484]">
                              Carregando imagens…
                            </p>
                          </div>
                        ) : !hasImages ? (
                          <button
                            type="button"
                            disabled={isUploading}
                            className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-[6px] bg-transparent px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]/40 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Adicionar imagens do alerta"
                            onClick={() => galleryInputRef.current?.click()}
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <p className="font-sans text-[13px] leading-[16px] text-[#333333]">
                                <span className="font-bold text-[#000000]">Adicione imagens</span>{' '}
                                no seu alerta
                              </p>
                              <p className="font-sans text-[13px] font-bold leading-[16px] text-[#1351B4]">
                                Clique Aqui
                              </p>
                            </div>
                            <img
                              src="/categories/1016.svg"
                              alt=""
                              aria-hidden
                              className="size-10 shrink-0 object-contain"
                            />
                          </button>
                        ) : displayImageUrls.length <= 3 ? (
                          <div className="flex h-full w-full flex-nowrap gap-[4px] px-[3,2px]">
                            {Array.from({ length: 3 }).map((_, idx) => {
                              const url = displayImageUrls[idx]
                              return url ? (
                                <button
                                  key={url}
                                  type="button"
                                  className="h-full min-w-0 flex-1 overflow-hidden rounded-[8px] bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]/30"
                                  onClick={() => setLightboxIndex(idx)}
                                  onDragStart={(e) => e.preventDefault()}
                                >
                                  <img
                                    src={url}
                                    alt=""
                                    draggable={false}
                                    className="pointer-events-none h-full w-full select-none object-cover"
                                  />
                                </button>
                              ) : (
                                <div
                                  key={`empty-${idx}`}
                                  aria-hidden
                                  className="h-full min-w-0 flex-1 rounded-[8px] bg-transparent"
                                />
                              )
                            })}
                          </div>
                        ) : (
                          <div
                            ref={carouselRef}
                            className="flex h-full w-full snap-x snap-mandatory flex-nowrap gap-[6px] overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              const el = carouselRef.current
                              if (!el) return
                              dragStateRef.current.isDown = true
                              dragStateRef.current.didDrag = false
                              dragStateRef.current.startX = e.clientX
                              dragStateRef.current.startScrollLeft =
                                el.scrollLeft
                              e.preventDefault()
                              el.setPointerCapture?.(e.pointerId)
                            }}
                            onPointerMove={(e) => {
                              const el = carouselRef.current
                              if (!el) return
                              if (!dragStateRef.current.isDown) return
                              const dx = e.clientX - dragStateRef.current.startX
                              if (Math.abs(dx) > 3)
                                dragStateRef.current.didDrag = true
                              el.scrollLeft =
                                dragStateRef.current.startScrollLeft - dx
                              e.preventDefault()
                            }}
                            onPointerUp={(e) => {
                              dragStateRef.current.isDown = false
                              carouselRef.current?.releasePointerCapture?.(
                                e.pointerId,
                              )
                            }}
                            onPointerCancel={(e) => {
                              dragStateRef.current.isDown = false
                              carouselRef.current?.releasePointerCapture?.(
                                e.pointerId,
                              )
                            }}
                            onPointerLeave={() => {
                              dragStateRef.current.isDown = false
                            }}
                          >
                            {Array.from({
                              length: Math.ceil(displayImageUrls.length / 3),
                            }).map((_, pageIdx) => {
                              const base = pageIdx * 3
                              const pageUrls = displayImageUrls.slice(
                                base,
                                base + 3,
                              )
                              return (
                                <div
                                  key={`page-${pageIdx}`}
                                  className="flex h-full w-full shrink-0 snap-start flex-nowrap gap-[6px]"
                                >
                                  {Array.from({ length: 3 }).map((__, idx) => {
                                    const url = pageUrls[idx]
                                    return url ? (
                                      <button
                                        key={url}
                                        type="button"
                                        className="h-full min-w-0 flex-1 overflow-hidden rounded-[8px] bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]/30"
                                        onClick={() => {
                                          if (dragStateRef.current.didDrag)
                                            return
                                          setLightboxIndex(base + idx)
                                        }}
                                        onDragStart={(e) => e.preventDefault()}
                                      >
                                        <img
                                          src={url}
                                          alt=""
                                          draggable={false}
                                          className="pointer-events-none h-full w-full select-none object-cover"
                                        />
                                      </button>
                                    ) : (
                                      <div
                                        key={`empty-${pageIdx}-${idx}`}
                                        aria-hidden
                                        className="h-full min-w-0 flex-1 rounded-[8px] bg-transparent"
                                      />
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {!emptyImageComposerMode ? (
                      <div
                        className="mt-2 flex w-full shrink-0 flex-wrap items-center justify-center gap-2 px-4 py-2 sm:px-5 lg:flex-nowrap lg:justify-start"
                        role="toolbar"
                        aria-label="Ações do alerta"
                      >
                        <button
                          type="button"
                          aria-expanded={isCommentsOpen}
                          aria-controls="structural-alert-comments-panel"
                          className="box-border inline-flex h-[36px] min-w-[64px] shrink-0 items-center justify-center gap-2 rounded-[23.5px] bg-[#1351B4] px-3.5 text-[14px] font-semibold leading-none text-white"
                          onClick={() => setIsCommentsOpen((prev) => !prev)}
                        >
                          <img
                            src={`${HEALTH_ICON_BASE}/${HEALTH_COMMENTS_BADGE_ICON}.svg`}
                            alt=""
                            aria-hidden
                            className="pointer-events-none size-4 shrink-0 object-contain"
                          />
                          <span className="tabular-nums">
                            {comments.length > 0
                              ? comments.length
                              : commentsCount}
                          </span>
                        </button>

                        <div
                          role="status"
                          aria-label={`Confirmações sim: ${likesCount}`}
                          className="pointer-events-none box-border inline-flex h-[36px] min-w-[64px] shrink-0 items-center justify-center gap-2 rounded-[23.5px] bg-[#1351B4]/45 px-3.5 text-[14px] font-semibold leading-none text-white"
                        >
                          <img
                            src={`${CLIMATIC_ICON_BASE}/${CLIMATIC_COMMUNITY_LIKE_ICON_ID}.svg`}
                            alt=""
                            aria-hidden
                            className="pointer-events-none size-4 shrink-0 object-contain"
                          />
                          <span className="tabular-nums">{likesCount}</span>
                        </div>

                        <div
                          role="status"
                          aria-label={`Confirmações não: ${dislikesCount}`}
                          className="pointer-events-none box-border inline-flex h-[36px] min-w-[64px] shrink-0 items-center justify-center gap-2 rounded-[23.5px] bg-[#1351B4]/45 px-3.5 text-[14px] font-semibold leading-none text-white"
                        >
                          <img
                            src={`${CLIMATIC_ICON_BASE}/${CLIMATIC_COMMUNITY_DISLIKE_ICON_ID}.svg`}
                            alt=""
                            aria-hidden
                            className="pointer-events-none h-[14px] w-[18px] shrink-0 object-contain"
                          />
                          <span className="tabular-nums">{dislikesCount}</span>
                        </div>

                        <button
                          type="button"
                          className="box-border inline-flex h-[36px] w-[72px] shrink-0 items-center justify-center gap-2 rounded-[20px] bg-[#1351B4] px-3.5 text-[14px] font-semibold leading-none tracking-normal text-white [font-family:Rawline]"
                          onClick={() => setRiskModalOpen(true)}
                        >
                          Risco
                        </button>

                        <div className="h-0 w-full lg:hidden" aria-hidden />

                        <button
                          type="button"
                          disabled={isUploading}
                          className="box-border inline-flex h-[36px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[20px] border border-[#1351B4] bg-white px-3 text-[13px] font-semibold leading-none text-[#1351B4] [font-family:Rawline] hover:bg-[#1351B4]/10 disabled:opacity-60 lg:hidden"
                          onClick={() => cameraInputRef.current?.click()}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="size-4 shrink-0"><path d="M10.3975 1.40381C11.0037 1.40383 11.5616 1.74741 11.833 2.29053L12.3916 3.40674H14.0225C14.9012 3.40686 15.625 4.13048 15.625 5.00928V13.022C15.6248 13.9006 14.9011 14.6234 14.0225 14.6235H7.01074V14.6226C6.93181 14.6234 6.85353 14.61 6.78027 14.5806C6.7064 14.5509 6.63873 14.5066 6.58203 14.4507C6.52558 14.395 6.48087 14.3285 6.4502 14.2554C6.41947 14.1819 6.40332 14.1026 6.40332 14.0229C6.40334 13.9434 6.41952 13.8649 6.4502 13.7915C6.4809 13.7181 6.52539 13.6511 6.58203 13.5952C6.63873 13.5393 6.7064 13.495 6.78027 13.4653C6.8535 13.4359 6.93186 13.4215 7.01074 13.4224H14.0225C14.253 13.4223 14.4226 13.2525 14.4229 13.022V9.61475H11.5605C11.2714 11.3147 9.79079 12.6206 8.01074 12.6206C6.23062 12.6206 4.75334 11.3146 4.46484 9.61475H1.60254V13.021C1.60276 13.2515 1.77244 13.4212 2.00293 13.4214H3.00488C3.08403 13.4204 3.16288 13.4348 3.23633 13.4644C3.31007 13.494 3.37697 13.5384 3.43359 13.5942C3.49029 13.6501 3.53568 13.7171 3.56641 13.7905C3.59703 13.8638 3.61326 13.9425 3.61328 14.022C3.61328 14.1016 3.59713 14.1809 3.56641 14.2544C3.53568 14.3277 3.49021 14.3939 3.43359 14.4497C3.37697 14.5055 3.3101 14.5499 3.23633 14.5796C3.16288 14.6091 3.08403 14.6225 3.00488 14.6216V14.6226H2.00293C1.12439 14.6223 0.401612 13.8995 0.401367 13.021V5.0083C0.401367 4.12956 1.12424 3.40599 2.00293 3.40576H3.63477L4.18359 2.30713C4.44695 1.72753 5.0324 1.40292 5.62891 1.40283L10.3975 1.40381ZM5.00781 13.4214C5.08671 13.4214 5.16539 13.4371 5.23828 13.4673C5.31095 13.4974 5.37696 13.5416 5.43262 13.5972C5.48841 13.653 5.53328 13.7196 5.56348 13.7925C5.59355 13.8652 5.60838 13.9433 5.6084 14.022C5.6084 14.1009 5.59367 14.1796 5.56348 14.2524C5.53329 14.3252 5.48835 14.391 5.43262 14.4468C5.37686 14.5025 5.31111 14.5475 5.23828 14.5776C5.16539 14.6078 5.08671 14.6226 5.00781 14.6226C4.92911 14.6225 4.85105 14.6077 4.77832 14.5776C4.70543 14.5474 4.6388 14.5026 4.58301 14.4468C4.52741 14.3911 4.48328 14.3251 4.45312 14.2524C4.42293 14.1796 4.40723 14.1009 4.40723 14.022C4.40725 13.9432 4.423 13.8653 4.45312 13.7925C4.48331 13.7196 4.52724 13.6529 4.58301 13.5972C4.6388 13.5414 4.70543 13.4975 4.77832 13.4673C4.85112 13.4371 4.92903 13.4214 5.00781 13.4214ZM8.01074 6.60986C6.67717 6.60991 5.60747 7.67874 5.60742 9.01221C5.60742 10.346 6.6774 11.4194 8.01074 11.4194C9.34433 11.4194 10.418 10.3458 10.418 9.01221C10.4179 7.67891 9.34456 6.60986 8.01074 6.60986ZM5.62891 2.60498C5.46416 2.60507 5.32858 2.69508 5.27832 2.80615L5.27637 2.81006C5.27297 2.81677 5.26927 2.82399 5.26562 2.83057L4.54395 4.2749C4.49405 4.37466 4.41714 4.45844 4.32227 4.51709C4.22745 4.57568 4.11829 4.60688 4.00684 4.60693H2.00293C1.77229 4.60713 1.60254 4.7776 1.60254 5.0083V8.41357H4.46387C4.75124 6.71283 6.22977 5.40776 8.01074 5.40771C9.79176 5.40771 11.2756 6.71256 11.5635 8.41357H14.4229V5.00928C14.4229 4.77851 14.2532 4.60802 14.0225 4.60791H12.0195C11.908 4.60792 11.798 4.57672 11.7031 4.51807C11.6083 4.45942 11.5313 4.37559 11.4814 4.27588L10.7578 2.82764C10.6892 2.69036 10.5517 2.605 10.3975 2.60498H5.62891ZM3.00488 5.40869C3.08366 5.40869 3.16158 5.42449 3.23438 5.45459C3.3072 5.48476 3.37393 5.52875 3.42969 5.58447C3.48548 5.64026 3.52938 5.70689 3.55957 5.77979C3.58973 5.8526 3.60544 5.93047 3.60547 6.00928C3.60547 6.08817 3.58976 6.16686 3.55957 6.23975C3.5294 6.31243 3.48532 6.37842 3.42969 6.43408C3.3739 6.48987 3.30727 6.53475 3.23438 6.56494C3.16163 6.595 3.0836 6.60986 3.00488 6.60986C2.92616 6.60986 2.84814 6.59501 2.77539 6.56494C2.7025 6.53475 2.63587 6.48987 2.58008 6.43408C2.52445 6.37842 2.48036 6.31243 2.4502 6.23975C2.42 6.16686 2.4043 6.08817 2.4043 6.00928C2.40433 5.93047 2.42004 5.85259 2.4502 5.77979C2.48039 5.70689 2.52429 5.64026 2.58008 5.58447C2.63584 5.52874 2.70255 5.48476 2.77539 5.45459C2.84819 5.42448 2.9261 5.4087 3.00488 5.40869Z" fill="#1351B4" stroke="#1351B4" strokeWidth="0.2"/></svg>
                          Câmera
                        </button>
                        <button
                          type="button"
                          disabled={isUploading}
                          className="box-border inline-flex h-[36px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[20px] border border-[#1351B4] bg-white px-3 text-[13px] font-semibold leading-none text-[#1351B4] [font-family:Rawline] hover:bg-[#1351B4]/10 disabled:opacity-60 lg:hidden"
                          onClick={() => galleryInputRef.current?.click()}
                        >
                          <ImageIcon className="size-3.5 shrink-0" aria-hidden />
                          Galeria
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 flex w-full shrink-0 flex-col items-end gap-8 px-4 pb-3 pt-0 sm:px-5">
                        <div className="flex w-full flex-wrap items-center justify-end gap-3">
                          <button
                            type="button"
                            disabled={isUploading}
                            className="box-border inline-flex h-[39px] w-[125px] shrink-0 items-center justify-center gap-2 rounded-[20px] border border-[#1351B4] bg-white px-6 py-2 text-sm font-semibold leading-none text-[#1351B4] transition-colors [font-family:Rawline] hover:bg-[#1351B4]/10 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]/35"
                            onClick={() => cameraInputRef.current?.click()}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="size-4 shrink-0">
                              <path d="M10.3975 1.40381C11.0037 1.40383 11.5616 1.74741 11.833 2.29053L12.3916 3.40674H14.0225C14.9012 3.40686 15.625 4.13048 15.625 5.00928V13.022C15.6248 13.9006 14.9011 14.6234 14.0225 14.6235H7.01074V14.6226C6.93181 14.6234 6.85353 14.61 6.78027 14.5806C6.7064 14.5509 6.63873 14.5066 6.58203 14.4507C6.52558 14.395 6.48087 14.3285 6.4502 14.2554C6.41947 14.1819 6.40332 14.1026 6.40332 14.0229C6.40334 13.9434 6.41952 13.8649 6.4502 13.7915C6.4809 13.7181 6.52539 13.6511 6.58203 13.5952C6.63873 13.5393 6.7064 13.495 6.78027 13.4653C6.8535 13.4359 6.93186 13.4215 7.01074 13.4224H14.0225C14.253 13.4223 14.4226 13.2525 14.4229 13.022V9.61475H11.5605C11.2714 11.3147 9.79079 12.6206 8.01074 12.6206C6.23062 12.6206 4.75334 11.3146 4.46484 9.61475H1.60254V13.021C1.60276 13.2515 1.77244 13.4212 2.00293 13.4214H3.00488C3.08403 13.4204 3.16288 13.4348 3.23633 13.4644C3.31007 13.494 3.37697 13.5384 3.43359 13.5942C3.49029 13.6501 3.53568 13.7171 3.56641 13.7905C3.59703 13.8638 3.61326 13.9425 3.61328 14.022C3.61328 14.1016 3.59713 14.1809 3.56641 14.2544C3.53568 14.3277 3.49021 14.3939 3.43359 14.4497C3.37697 14.5055 3.3101 14.5499 3.23633 14.5796C3.16288 14.6091 3.08403 14.6225 3.00488 14.6216V14.6226H2.00293C1.12439 14.6223 0.401612 13.8995 0.401367 13.021V5.0083C0.401367 4.12956 1.12424 3.40599 2.00293 3.40576H3.63477L4.18359 2.30713C4.44695 1.72753 5.0324 1.40292 5.62891 1.40283L10.3975 1.40381ZM5.00781 13.4214C5.08671 13.4214 5.16539 13.4371 5.23828 13.4673C5.31095 13.4974 5.37696 13.5416 5.43262 13.5972C5.48841 13.653 5.53328 13.7196 5.56348 13.7925C5.59355 13.8652 5.60838 13.9433 5.6084 14.022C5.6084 14.1009 5.59367 14.1796 5.56348 14.2524C5.53329 14.3252 5.48835 14.391 5.43262 14.4468C5.37686 14.5025 5.31111 14.5475 5.23828 14.5776C5.16539 14.6078 5.08671 14.6226 5.00781 14.6226C4.92911 14.6225 4.85105 14.6077 4.77832 14.5776C4.70543 14.5474 4.6388 14.5026 4.58301 14.4468C4.52741 14.3911 4.48328 14.3251 4.45312 14.2524C4.42293 14.1796 4.40723 14.1009 4.40723 14.022C4.40725 13.9432 4.423 13.8653 4.45312 13.7925C4.48331 13.7196 4.52724 13.6529 4.58301 13.5972C4.6388 13.5414 4.70543 13.4975 4.77832 13.4673C4.85112 13.4371 4.92903 13.4214 5.00781 13.4214ZM8.01074 6.60986C6.67717 6.60991 5.60747 7.67874 5.60742 9.01221C5.60742 10.346 6.6774 11.4194 8.01074 11.4194C9.34433 11.4194 10.418 10.3458 10.418 9.01221C10.4179 7.67891 9.34456 6.60986 8.01074 6.60986ZM5.62891 2.60498C5.46416 2.60507 5.32858 2.69508 5.27832 2.80615L5.27637 2.81006C5.27297 2.81677 5.26927 2.82399 5.26562 2.83057L4.54395 4.2749C4.49405 4.37466 4.41714 4.45844 4.32227 4.51709C4.22745 4.57568 4.11829 4.60688 4.00684 4.60693H2.00293C1.77229 4.60713 1.60254 4.7776 1.60254 5.0083V8.41357H4.46387C4.75124 6.71283 6.22977 5.40776 8.01074 5.40771C9.79176 5.40771 11.2756 6.71256 11.5635 8.41357H14.4229V5.00928C14.4229 4.77851 14.2532 4.60802 14.0225 4.60791H12.0195C11.908 4.60792 11.798 4.57672 11.7031 4.51807C11.6083 4.45942 11.5313 4.37559 11.4814 4.27588L10.7578 2.82764C10.6892 2.69036 10.5517 2.605 10.3975 2.60498H5.62891ZM3.00488 5.40869C3.08366 5.40869 3.16158 5.42449 3.23438 5.45459C3.3072 5.48476 3.37393 5.52875 3.42969 5.58447C3.48548 5.64026 3.52938 5.70689 3.55957 5.77979C3.58973 5.8526 3.60544 5.93047 3.60547 6.00928C3.60547 6.08817 3.58976 6.16686 3.55957 6.23975C3.5294 6.31243 3.48532 6.37842 3.42969 6.43408C3.3739 6.48987 3.30727 6.53475 3.23438 6.56494C3.16163 6.595 3.0836 6.60986 3.00488 6.60986C2.92616 6.60986 2.84814 6.59501 2.77539 6.56494C2.7025 6.53475 2.63587 6.48987 2.58008 6.43408C2.52445 6.37842 2.48036 6.31243 2.4502 6.23975C2.42 6.16686 2.4043 6.08817 2.4043 6.00928C2.40433 5.93047 2.42004 5.85259 2.4502 5.77979C2.48039 5.70689 2.52429 5.64026 2.58008 5.58447C2.63584 5.52874 2.70255 5.48476 2.77539 5.45459C2.84819 5.42448 2.9261 5.4087 3.00488 5.40869Z" fill="#1351B4" stroke="#1351B4" strokeWidth="0.2"/>
                            </svg>
                            Câmera
                          </button>
                          <button
                            type="button"
                            disabled={isUploading}
                            aria-label="Adição de imagens do Alerta"
                            className="box-border inline-flex h-[39px] w-[125px] shrink-0 items-center justify-center gap-2 rounded-[20px] border-0 bg-[#1351B4] px-6 py-2 text-sm font-semibold leading-none text-white transition-colors duration-[400ms] ease-out [font-family:Rawline] hover:bg-[#0f3f8f] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]/35"
                            onClick={() => galleryInputRef.current?.click()}
                          >
                            <ImageIcon
                              className="size-4 shrink-0"
                              aria-hidden
                            />
                            Galeria
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label="Visualização de Alerta cadastrado sem imagem"
                          className="box-border inline-flex h-[39px] w-[91px] shrink-0 items-center justify-center gap-2 rounded-[20px] border-0 bg-white px-6 py-2 text-sm font-semibold leading-none text-[#1351B4] transition-colors duration-[400ms] ease-out [font-family:Rawline] hover:bg-[#1351B4]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351B4]/35"
                          onClick={() => onOpenChange(false)}
                        >
                          Sair
                        </button>
                      </div>
                    )}
                  </div>

                  {!emptyImageComposerMode && isCommentsOpen ? (
                    <div
                      id="structural-alert-comments-panel"
                      className="mt-3"
                      role="region"
                      aria-label="Comentários do alerta"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <img
                          src={`${HEALTH_ICON_BASE}/${HEALTH_COMMENTS_SECTION_ICON}.svg`}
                          alt=""
                          aria-hidden
                          className="pointer-events-none size-[14px] shrink-0 object-contain"
                        />
                        <span className="inline-flex min-h-[17px] items-center text-[12px] leading-[100%] tracking-normal text-[#1351B4] [font-family:Rawline]">
                          <span className="font-bold">Comentários</span>
                          <span className="font-medium">
                            {' ('}{' '}
                            {comments.length > 0
                              ? comments.length
                              : commentsCount}{' '}
                            {')'}
                          </span>
                        </span>
                      </div>

                      {isLoadingComments ? (
                        <div className="box-border min-h-[53px] w-full max-w-[428px] rounded-[4px] bg-[#F0F8FF] px-3 py-3 text-sm text-[#1351B4]/90 [font-family:Rawline]">
                          Carregando comentários…
                        </div>
                      ) : comments.length > 0 ? (
                        <div
                          ref={commentsListScrollRef}
                          className="max-h-[calc(3*53px+2*0.75rem)] w-full max-w-[428px] space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:rgba(19,81,180,0.25)_transparent] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(19,81,180,0.25)]"
                          role="log"
                          aria-label="Lista de comentários"
                        >
                          {comments.map((comment) => (
                            <div
                              key={comment.commentId}
                              className="box-border min-h-[53px] w-full max-w-[428px] shrink-0 rounded-[4px] bg-[#F0F8FF] px-3 py-3"
                            >
                              <p className="text-justify text-[12px] leading-[100%] [font-family:Rawline]">
                                <span className="font-semibold text-[#1351B4]">
                                  Anônimo:
                                </span>{' '}
                                <span className="font-normal text-[#1351B4]/90">
                                  {comment.content}
                                </span>
                              </p>
                              <p className="mt-1 text-xs text-[#848484] [font-family:Rawline]">
                                {formatShortTimeAgoPt(comment.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="box-border min-h-[53px] w-full max-w-[428px] rounded-[4px] bg-[#F0F8FF] px-3 py-3 text-sm text-[#666666] [font-family:Rawline]">
                          Ainda não há comentários neste alerta.
                        </div>
                      )}

                      <div className="mt-4 flex w-full max-w-[428px] flex-col gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Deixe seu comentário..."
                          rows={2}
                          disabled={isSubmittingComment}
                          className={cn(
                            'box-border min-h-[64px] w-full resize-y rounded-[4px] border border-[#E5E7EB] bg-[#F6F6F6] px-4 py-2 text-sm leading-relaxed text-[#333333] shadow-none',
                            'placeholder:italic placeholder:text-[#848484]',
                            'focus-visible:border-[#1351B4] focus-visible:ring-2 focus-visible:ring-[#1351B4]/25 focus-visible:ring-offset-0',
                            '[font-family:Rawline]',
                          )}
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            aria-label="Enviar comentário"
                            className="grid size-11 shrink-0 place-items-center rounded-full border-0 bg-[#1351B4] text-white transition-[opacity,transform,background-color] duration-300 ease-out will-change-transform hover:bg-[#0f3f8f] active:scale-[0.94] active:opacity-85 motion-reduce:transition-none motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 disabled:active:opacity-60"
                            disabled={
                              isSubmittingComment || !commentText.trim()
                            }
                            onClick={() => void submitComment()}
                          >
                            <img
                              src={`${HEALTH_ICON_BASE}/${HEALTH_COMMENT_SEND_ICON}.svg`}
                              alt=""
                              aria-hidden
                              className="pointer-events-none size-8 max-h-full max-w-full shrink-0 object-contain object-center"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>

      <RiskAlertDialog
        open={riskModalOpen}
        onOpenChange={setRiskModalOpen}
        onBack={() => setRiskModalOpen(false)}
        initialSelectedIconIds={initialRiskIcons}
        onConfirm={async ({ selectedIconIds }) => {
          const labels = selectedIconIds
            .map((icon) => RISK_SITUATIONS.find((r) => r.icon === icon)?.label)
            .filter((v): v is string => Boolean(v))
          setRiskText(labels.length > 0 ? labels.join(', ') : null)
          setRiskModalOpen(false)
        }}
      />
    </Dialog>

    {lightboxIndex !== null && displayImageUrls.length > 0 && (
      <ImageLightbox
        images={displayImageUrls}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    )}
  </>
  )
}
