import { useState, useEffect } from 'react'
import { blink } from '../blink/client'

interface User {
  id: string
  email: string
  displayName?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setAuthState({
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated
      })
    })

    return unsubscribe
  }, [blink])

  const login = (redirectUrl?: string) => {
    blink.auth.login(redirectUrl)
  }

  const logout = (redirectUrl?: string) => {
    blink.auth.logout(redirectUrl)
  }

  return {
    ...authState,
    login,
    logout
  }
}