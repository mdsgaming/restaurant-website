'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1109',
            color: '#FAF8F3',
            borderRadius: '8px',
            border: '1px solid rgba(45,122,69,0.4)',
          },
          success: {
            iconTheme: { primary: '#2D7A45', secondary: '#1A1109' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#FAF8F3' },
          },
        }}
      />
    </AuthProvider>
  )
}
