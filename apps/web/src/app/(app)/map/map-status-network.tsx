'use client'

import { Badge } from '@/components/badge'
import { useStatusNetwork } from '@/hooks/use-status-network'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

export function MapStatusNetwork() {
  const { isOnline, isChecking } = useStatusNetwork()

  return (
    <Badge
      className={cn(
        'sm:min-w-33',
        isChecking
          ? 'border-primary text-primary bg-primary/20'
          : isOnline
            ? 'border-green-600 text-green-600 bg-green-50'
            : 'border-zinc-600 text-zinc-600 bg-zinc-100',
      )}
      variant="outline"
    >
      {isChecking ? (
        <RefreshCw className="mr-1 animate-spin" />
      ) : (
        <div
          className={cn(
            'absolute left-3 size-2 rounded-full',
            isOnline ? 'bg-green-600' : 'bg-zinc-600',
          )}
        />
      )}

      {isChecking ? 'Sincronizando' : isOnline ? 'Online' : 'Offline'}
    </Badge>
  )
}
