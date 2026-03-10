'use client'

import { Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-black text-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#57ff55] to-[#4826ae] flex items-center justify-center shadow-lg shadow-[#57ff55]/20">
            <Sparkles className="w-6 h-6 text-black" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">2HEAL</h1>
            <p className="text-sm text-white/60 font-medium">PhysioAssistent</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#57ff55] animate-pulse" />
          <span className="text-sm text-white/80">Online</span>
        </div>
      </div>
    </header>
  )
}
