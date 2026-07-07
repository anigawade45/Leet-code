'use client'

import { Server } from 'lucide-react'

export function SystemHealth({ stats }) {
  return (
    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-2xl flex flex-col">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Server className="w-5 h-5 text-[#ec4899]" /> System Health
      </h2>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {stats?.systemHealth?.map((system, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
            <span className="text-sm font-medium">{system.name}</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${system.status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
              <span className={`text-xs font-semibold ${system.status === 'Online' ? 'text-green-400' : 'text-red-400'}`}>{system.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
