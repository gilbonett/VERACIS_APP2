'use client'

import { MicrosoftClarityInit } from '@/components/analytics/microsoft-clarity-init'
import { AnchoredToastProvider, ToastProvider } from '@/components/toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(new QueryClient())
  return (
    <NuqsAdapter>
      <MicrosoftClarityInit />
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <ToastProvider>
          <AnchoredToastProvider>{children}</AnchoredToastProvider>
        </ToastProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
