
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'
import { LanguageProvider } from '@/contexts/language-context'
import { SessionProvider } from '@/contexts/auth-context'
import { AppProvider } from '@/contexts/app-context'

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, 
      }
    }
  }))

  return (
    <QueryClientProvider client={client}>
      <SessionProvider>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <LanguageProvider>
              <AppProvider>
                {children}
              </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SessionProvider>
      {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
