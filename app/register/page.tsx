'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Mail, Lock, UserPlus, Loader2, ArrowRight, LogIn } from 'lucide-react'
import Link from 'next/link'
import Image from "next/image"

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, error, clearError } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    
    if (password !== confirmPassword) {
      setLocalError('Passwoerter stimmen nicht ueberein')
      return
    }

    if (password.length < 6) {
      setLocalError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setIsSubmitting(true)
    
    try {
      await register(email, password)
      router.push('/')
    } catch {
      // Error handled by context
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-dvh bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className=" mx-auto mb-4 flex items-center justify-center">
            
          
          <Image
                  src="/icons/icon-256x256.png"
                  alt="App Icon"
                  width={200}
                  height={200}
                  className="w-24 h-24  rounded-xl sm:rounded-2xl shadow-lg"
                />
                </div>
          <h1 className="text-2xl font-bold text-white">Konto erstellen</h1>
          <p className="text-white/60 mt-2">Registrieren Sie sich fuer den PhysioAssistenten</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {displayError}
              <button 
                type="button" 
                onClick={() => { clearError(); setLocalError(null); }}
                className="float-right text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail-Adresse"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#57ff55]/50 focus:ring-1 focus:ring-[#57ff55]/50 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort (mind. 6 Zeichen)"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#57ff55]/50 focus:ring-1 focus:ring-[#57ff55]/50 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort bestaetigen"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#57ff55]/50 focus:ring-1 focus:ring-[#57ff55]/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#57ff55] to-[#4826ae] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Registrieren
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-white/60">
            Bereits ein Konto?{' '}
            <Link href="/login" className="text-[#57ff55] hover:underline font-medium inline-flex items-center gap-1">
              <LogIn className="w-4 h-4" />
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
