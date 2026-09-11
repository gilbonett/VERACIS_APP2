import {
  createResilientEventSource,
  type ConnectionStatus,
} from '@/lib/sse-connection'

interface SharedEventSourceListener<T> {
  onData: (value: T, eventName: string) => void
  onStatus: (status: ConnectionStatus) => void
}

type BroadcastMessage<T> =
  | { type: 'data'; payload: T; eventName: string }
  | { type: 'status'; status: ConnectionStatus }

export function supportsSharedConnection() {
  return (
    typeof navigator !== 'undefined' &&
    'locks' in navigator &&
    typeof BroadcastChannel !== 'undefined'
  )
}

/**
 * Elects a single tab as the connection owner (Web Locks API) and fans out
 * every event to all tabs (BroadcastChannel). Only the owner talks to the
 * server, so N open tabs cost the backend a single SSE connection.
 * Ownership transfers automatically when the owning tab is hidden or closed.
 */
export function subscribeToSharedEventSource<T>(
  url: string,
  eventNames: string | string[],
  listener: SharedEventSourceListener<T>,
): () => void {
  const channel = new BroadcastChannel(`sse:${url}`)

  channel.onmessage = ({ data }: MessageEvent<BroadcastMessage<T>>) => {
    if (data.type === 'data') listener.onData(data.payload, data.eventName)
    else listener.onStatus(data.status)
  }

  const lockName = `sse-lock:${url}`
  let abortController: AbortController | undefined
  let releaseOwnership: (() => void) | undefined

  function becomeOwner() {
    abortController = new AbortController()

    navigator.locks
      .request(lockName, { signal: abortController.signal }, () => {
        const connection = createResilientEventSource<T>(
          url,
          eventNames,
          (value, eventName) => {
            listener.onData(value, eventName)
            channel.postMessage({
              type: 'data',
              payload: value,
              eventName,
            } satisfies BroadcastMessage<T>)
          },
          (status) => {
            listener.onStatus(status)
            channel.postMessage({
              type: 'status',
              status,
            } satisfies BroadcastMessage<T>)
          },
        )

        return new Promise<void>((resolve) => {
          releaseOwnership = () => {
            connection.close()
            releaseOwnership = undefined
            resolve()
          }
        })
      })
      .catch(() => {
        // request aborted while waiting in the queue
      })
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      abortController?.abort()
      releaseOwnership?.()
    } else if (!releaseOwnership) {
      becomeOwner()
    }
  }

  if (document.visibilityState === 'visible') becomeOwner()

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    abortController?.abort()
    releaseOwnership?.()
    channel.close()
  }
}
