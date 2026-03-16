'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, onAuthChange, signIn, signUp, signOut } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    let isMounted = true
    let unsubscribe: (() => void) | null = null
    
    // Small delay to ensure Firebase is initialized
    const initAuth = () => {
      unsubscribe = onAuthChange((authUser) => {
        if (isMounted) {
          setUser(authUser)
          setLoading(false)
        }
      })
      
      // If unsubscribe is empty function, auth didn't initialize - set loading false anyway
      setTimeout(() => {
        if (isMounted && loading) {
          setLoading(false)
        }
      }, 1000)
    }

    initAuth()

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen'
      if (message.includes('invalid-credential')) {
        setError('Ungueltige E-Mail oder Passwort')
      } else if (message.includes('user-not-found')) {
        setError('Benutzer nicht gefunden')
      } else if (message.includes('wrong-password')) {
        setError('Falsches Passwort')
      } else {
        setError(message)
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      await signUp(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen'
      if (message.includes('email-already-in-use')) {
        setError('Diese E-Mail wird bereits verwendet')
      } else if (message.includes('weak-password')) {
        setError('Passwort muss mindestens 6 Zeichen lang sein')
      } else if (message.includes('invalid-email')) {
        setError('Ungueltige E-Mail-Adresse')
      } else {
        setError(message)
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setError(null)
    try {
      await signOut()
    } catch (err) {
      setError('Abmeldung fehlgeschlagen')
      throw err
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
