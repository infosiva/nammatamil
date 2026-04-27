'use client'

import { Trophy } from 'lucide-react'

export default function CricketWidget() {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'linear-gradient(160deg, #001a0a 0%, #002d14 60%)',
        border: '1px solid rgba(34,197,94,0.2)',
      }}
    >
      <h3 className="text-white font-bold text-sm flex items-center gap-2">
        <Trophy className="w-4 h-4 text-green-400" /> IPL 2025 Live
      </h3>
      <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between items-center">
          <span className="text-white/70 text-xs font-semibold">CSK</span>
          <span className="text-white font-black text-sm">186/4</span>
          <span className="text-white/30 text-[10px]">(18.2 ov)</span>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex justify-between items-center">
          <span className="text-white/70 text-xs font-semibold">MI</span>
          <span className="text-green-400 font-black text-sm">Yet to bat</span>
          <span className="text-white/30 text-[10px]"></span>
        </div>
      </div>
      <p className="text-white/25 text-[10px]">
        Live scores via ESPNCricinfo · Updates every match day
      </p>
    </div>
  )
}
