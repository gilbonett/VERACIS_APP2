import {
  subscribeToSharedEventSource,
  supportsSharedConnection,
} from '@/lib/shared-sse-connection'
import {
  createResilientEventSource,
  type ConnectionStatus,
} from '@/lib/sse-connection'
import { useEffect, useState } from 'react'

export type { ConnectionStatus }

export function useEventSource<T = unknown>(
  url: string | URL,
  eventNames: string | string[] = 'notifications',
  enabled = true,
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [event, setEvent] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  const eventNamesKey = Array.isArray(eventNames)
    ? eventNames.join(',')
    : eventNames

  useEffect(() => {
    if (!enabled) return

    const urlString = url.toString()

    function onData(value: T, eventName: string) {
      setData(value)
      setEvent(eventName)
    }

    if (!supportsSharedConnection()) {
      const connection = createResilientEventSource<T>(
        urlString,
        eventNames,
        onData,
        setStatus,
      )

      return () => connection.close()
    }

    return subscribeToSharedEventSource<T>(urlString, eventNames, {
      onData,
      onStatus: setStatus,
    })
  }, [url, eventNamesKey, enabled])

  return { data, event, status }
}
