// src/components/auth-visibility-handler.tsx
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthVisibilityHandler() {
  useEffect(() => {
    const handleVisibility = () => {
      if (supabase?.auth) {
        if (document.visibilityState === 'visible') {
          supabase.auth.startAutoRefresh()
        } else {
          supabase.auth.stopAutoRefresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    // Panggil langsung saat pertama kali render
    handleVisibility()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return null
}
