'use client'

import CountUp from 'react-countup'
import { Trophy } from 'lucide-react'

export function ContestOverview({ stats }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-2xl">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#8b5cf6]" /> Contest Overview
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-background border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_#8b5cf6] animate-pulse"></div>
            <span className="text-sm font-medium">Running</span>
          </div>
          <span className="text-lg font-bold"><CountUp end={stats?.contestStats?.running || 0} /></span>
        </div>
        <div className="flex justify-between items-center p-3 bg-background border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
            <span className="text-sm font-medium text-muted-foreground">Upcoming</span>
          </div>
          <span className="text-lg font-bold"><CountUp end={stats?.contestStats?.upcoming || 0} /></span>
        </div>
        <div className="flex justify-between items-center p-3 bg-background border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#34d399]"></div>
            <span className="text-sm font-medium text-muted-foreground">Completed</span>
          </div>
          <span className="text-lg font-bold"><CountUp end={stats?.contestStats?.completed || 0} /></span>
        </div>
      </div>
    </div>
  )
}
