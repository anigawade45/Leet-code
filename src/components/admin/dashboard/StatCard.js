'use client'

import CountUp from 'react-countup'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

export function StatCard({ label, value, suffix, icon, gradient, glow, trend }) {
  const getTrendIcon = () => {
    if (trend.startsWith('+')) return <ArrowUpRight className="w-3 h-3" />
    if (trend.startsWith('-')) return <ArrowDownRight className="w-3 h-3" />
    if (trend === '0%') return <Minus className="w-3 h-3" />
    return null
  }

  const getTrendColor = () => {
    if (trend.startsWith('+')) return 'text-green-400 bg-green-500/10'
    if (trend.startsWith('-')) return 'text-red-400 bg-red-500/10'
    if (trend === '0%') return 'text-gray-400 bg-gray-500/10'
    return 'text-green-400 bg-green-500/10' // fallback for text labels like 'Healthy'
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 ${glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${getTrendColor()}`}>
            {getTrendIcon()}
            {trend}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          <CountUp end={value} />
        </span>
        {suffix && <span className="text-xl font-bold">{suffix}</span>}
      </div>
      <p className="text-muted-foreground text-sm mt-1 font-medium">{label}</p>
    </div>
  )
}
