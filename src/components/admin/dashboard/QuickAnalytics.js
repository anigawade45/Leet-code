'use client'

import CountUp from 'react-countup'
import { BarChart2 } from 'lucide-react'

export function QuickAnalytics({ stats }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-2xl">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-[#3b82f6]" /> Quick Analytics
      </h2>
      <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">Today's Performance</p>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Submissions</span>
          <span className="font-bold"><CountUp end={stats?.quickAnalytics?.todaySubmissions || 0} /></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Accepted</span>
          <span className="font-bold text-[#34d399]"><CountUp end={stats?.quickAnalytics?.accepted || 0} /></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Accuracy</span>
          <span className="font-bold"><CountUp end={stats?.quickAnalytics?.accuracy || 0} />%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Avg Runtime</span>
          <span className="font-bold">{stats?.quickAnalytics?.avgRuntime || 0} ms</span>
        </div>
      </div>
    </div>
  )
}
