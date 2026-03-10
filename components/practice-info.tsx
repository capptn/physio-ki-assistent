'use client'

import { PRACTICE_INFO } from '@/lib/practice-config'
import { Phone, Mail, MapPin, Globe, Clock, ArrowRight } from 'lucide-react'

export function PracticeInfo() {
  return (
    <div className="bg-gradient-to-br from-[#57ff55]/10 to-[#4826ae]/10 border border-[#57ff55]/20 rounded-2xl p-5">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#57ff55] flex items-center justify-center">
          <Phone className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
        </span>
        Jetzt Kontakt aufnehmen
      </h3>
      
      <div className="grid gap-3">
        <a 
          href={`tel:${PRACTICE_INFO.phone.replace(/\s/g, '')}`}
          className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-[#57ff55]/10 border border-white/5 hover:border-[#57ff55]/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-[#57ff55]" strokeWidth={2} />
            <div>
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Telefon</p>
              <p className="text-sm font-bold text-white">{PRACTICE_INFO.phone}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#57ff55] group-hover:translate-x-1 transition-all" />
        </a>

        <a 
          href={`mailto:${PRACTICE_INFO.email}`}
          className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-[#57ff55]/10 border border-white/5 hover:border-[#57ff55]/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-[#57ff55]" strokeWidth={2} />
            <div>
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">E-Mail</p>
              <p className="text-sm font-bold text-white">{PRACTICE_INFO.email}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#57ff55] group-hover:translate-x-1 transition-all" />
        </a>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <MapPin className="w-4 h-4 text-[#4826ae]" strokeWidth={2} />
          <div>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Adresse</p>
            <p className="text-sm font-medium text-white/80">{PRACTICE_INFO.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <Clock className="w-4 h-4 text-[#4826ae]" strokeWidth={2} />
          <div>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Oeffnungszeiten</p>
            <p className="text-sm text-white/80">
              <span className="font-medium">Mo-Do:</span> {PRACTICE_INFO.hours.monday} | <span className="font-medium">Fr:</span> {PRACTICE_INFO.hours.friday}
            </p>
          </div>
        </div>

        <a 
          href={`https://${PRACTICE_INFO.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#57ff55]/20 to-[#4826ae]/20 hover:from-[#57ff55]/30 hover:to-[#4826ae]/30 border border-[#57ff55]/20 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-[#57ff55]" strokeWidth={2} />
            <div>
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Website besuchen</p>
              <p className="text-sm font-bold text-[#57ff55]">{PRACTICE_INFO.website}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#57ff55] group-hover:translate-x-1 transition-all" />
        </a>
      </div>
    </div>
  )
}
