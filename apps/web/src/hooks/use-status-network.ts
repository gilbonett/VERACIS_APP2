'use client'

import { useCallback, useEffect, useState } from 'react'

export interface StatusNetworkOptions {
  /**
   * URL para fazer o ping para verificar a conectividade real
   * @default undefined (usa apenas navigator.onLine)
   */
  pingUrl?: string
  /**
   * Intervalo em milissegundos para verificar a conectividade quando offline
   * @default 5000 (5 segundos)
   */
  checkInterval?: number
  /**
   * Timeout em milissegundos para a requisição de ping
   * @default 5000 (5 segundos)
   */
  pingTimeout?: number
  /**
   * Callback executado quando o status muda para online
   */
  onOnline?: () => void
  /**
   * Callback executado quando o status muda para offline
   */
  onOffline?: () => void
}

export interface StatusNetwork {
  /**
   * Indica se está online
   */
  isOnline: boolean
  /**
   * Indica se está verificando a conectividade
   */
  isChecking: boolean
  /**
   * Timestamp da última vez que ficou offline
   */
  lastOfflineAt: Date | null
  /**
   * Timestamp da última vez que ficou online
   */
  lastOnlineAt: Date | null
  /**
   * Força uma verificação manual da conectividade
   */
  checkConnection: () => Promise<boolean>
  /**
   * Indica se o hook foi montado no cliente
   */
  isMounted: boolean
}

export function useStatusNetwork(
  options: StatusNetworkOptions = {},
): StatusNetwork {
  const {
    pingUrl,
    checkInterval = 5000,
    pingTimeout = 5000,
    onOnline,
    onOffline,
  } = options

  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isChecking, setIsChecking] = useState(false)
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null)
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!pingUrl) {
      return typeof navigator !== 'undefined' ? navigator.onLine : true
    }

    setIsChecking(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), pingTimeout)

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (err) {
      console.log(err)
      return false
    } finally {
      setIsChecking(false)
    }
  }, [pingUrl, pingTimeout])

  const updateOnlineStatus = useCallback(
    (online: boolean) => {
      setIsOnline((prevOnline) => {
        if (prevOnline !== online) {
          if (online) {
            setLastOnlineAt(new Date())
            onOnline?.()
          } else {
            setLastOfflineAt(new Date())
            onOffline?.()
          }
        }
        return online
      })
    },
    [onOnline, onOffline],
  )

  useEffect(() => {
    setIsMounted(true)

    const initialStatus = navigator.onLine
    setIsOnline(initialStatus)

    if (!initialStatus) {
      setLastOfflineAt(new Date())
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const handleOnline = async () => {
      if (pingUrl) {
        const isReallyOnline = await checkConnection()
        updateOnlineStatus(isReallyOnline)
      } else {
        updateOnlineStatus(true)
      }
    }

    const handleOffline = () => {
      updateOnlineStatus(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    handleOnline()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isMounted, pingUrl, checkConnection, updateOnlineStatus])

  useEffect(() => {
    if (!isMounted) return

    if (!isOnline && pingUrl) {
      const intervalId = setInterval(async () => {
        const online = await checkConnection()
        if (online) {
          updateOnlineStatus(true)
        }
      }, checkInterval)

      return () => clearInterval(intervalId)
    }
  }, [
    isMounted,
    isOnline,
    pingUrl,
    checkInterval,
    checkConnection,
    updateOnlineStatus,
  ])

  return {
    isOnline,
    isChecking,
    lastOfflineAt,
    lastOnlineAt,
    checkConnection,
    isMounted,
  }
}
