export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

export interface Connection {
  close(): void
}

const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30_000

function nextRetryDelay(attempt: number) {
  const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS)

  return delay * (0.5 + Math.random() * 0.5)
}

export function createResilientEventSource<T>(
  url: string,
  eventNames: string | string[],
  onData: (value: T, eventName: string) => void,
  onStatus: (status: ConnectionStatus) => void,
): Connection {
  const names = Array.isArray(eventNames) ? eventNames : [eventNames]

  let eventSource: EventSource | undefined
  let retryTimeout: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let closed = false

  function connect() {
    onStatus(attempt === 0 ? 'connecting' : 'reconnecting')

    eventSource = new EventSource(url, { withCredentials: true })

    for (const name of names) {
      eventSource.addEventListener(name, (event) => {
        onData(JSON.parse((event as MessageEvent<string>).data), name)
      })
    }

    eventSource.onopen = () => {
      attempt = 0
      onStatus('open')
    }

    eventSource.onerror = () => {
      eventSource?.close()

      if (closed) return

      retryTimeout = setTimeout(connect, nextRetryDelay(attempt))
      attempt += 1
    }
  }

  connect()

  return {
    close() {
      closed = true
      clearTimeout(retryTimeout)
      eventSource?.close()
      onStatus('closed')
    },
  }
}
