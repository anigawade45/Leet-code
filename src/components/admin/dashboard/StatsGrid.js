'use client'

import { useMemo } from 'react'
import { FileCode, Clock3, CheckCircle, XCircle, Target, Users } from 'lucide-react'
import { StatCard } from './StatCard'

export function StatsGrid({ stats }) {
  const approvalRate = stats?.total ? Math.round((stats.approved / stats.total) * 100) : 0

  const statCards = useMemo(() => [
    {
      label: 'Total Problems',
      value: stats?.total || 0,
      icon: <FileCode className="w-8 h-8 text-white" />,
      gradient: 'from-[#2a9d8f] to-[#1a7a6e]',
      glow: 'shadow-[0_0_30px_rgba(42,157,143,0.15)]',
      trend: stats?.trends?.problems || '0%'
    },
    {
      label: 'Pending Review',
      value: stats?.pending || 0,
      icon: <Clock3 className="w-8 h-8 text-white" />,
      gradient: 'from-[#f59e0b] to-[#d97706]',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      trend: 'Action needed'
    },
    {
      label: 'Approved',
      value: stats?.approved || 0,
      icon: <CheckCircle className="w-8 h-8 text-white" />,
      gradient: 'from-[#34d399] to-[#059669]',
      glow: 'shadow-[0_0_30px_rgba(52,211,153,0.15)]',
      trend: stats?.trends?.approvalRate || '0%'
    },
    {
      label: 'Rejected',
      value: stats?.rejected || 0,
      icon: <XCircle className="w-8 h-8 text-white" />,
      gradient: 'from-[#ef4444] to-[#dc2626]',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
      trend: 'Filtered'
    },
    {
      label: 'Approval Rate',
      value: approvalRate,
      suffix: '%',
      icon: <Target className="w-8 h-8 text-white" />,
      gradient: 'from-[#3b82f6] to-[#2563eb]',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
      trend: 'Healthy'
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <Users className="w-8 h-8 text-white" />,
      gradient: 'from-[#8b5cf6] to-[#6d28d9]',
      glow: 'shadow-[0_0_30px_rgba(139,92,246,0.15)]',
      trend: stats?.trends?.users || '0%'
    },
  ], [stats, approvalRate])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5 mb-8">
      {statCards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  )
}
