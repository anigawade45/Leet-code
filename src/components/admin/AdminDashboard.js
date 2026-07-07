'use client'

import { useState, memo } from 'react'
import { RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'

// Hooks
import { useAdminDashboard } from '@/hooks/useAdminDashboard'

// Import Subcomponents
import { AdminHeader } from './dashboard/AdminHeader'
import { StatsGrid } from './dashboard/StatsGrid'
import { ContestOverview } from './dashboard/ContestOverview'
import { QuickAnalytics } from './dashboard/QuickAnalytics'
import { SystemHealth } from './dashboard/SystemHealth'
import { PendingReview } from './dashboard/PendingReview'
import { ActivityTimeline } from './dashboard/ActivityTimeline'
import { DashboardSkeleton } from './dashboard/DashboardSkeleton'
import { ErrorBanner } from './dashboard/ErrorBanner'

// Lazy Load Heavy Charts
const WeeklyChart = dynamic(
  () => import('./dashboard/WeeklyChart').then((mod) => mod.WeeklyChart),
  { ssr: false }
)

const DifficultyChart = dynamic(
  () => import('./dashboard/DifficultyChart').then((mod) => mod.DifficultyChart),
  { ssr: false }
)

export const AdminDashboard = memo(function AdminDashboard() {
  const {
    stats,
    recentPending,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    refresh
  } = useAdminDashboard()
  
  const [search, setSearch] = useState("")

  if (loading && !stats) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex-1 bg-background min-h-screen p-6 md:p-8 text-white">
      <ErrorBanner error={error} onRetry={refresh} />

      {/* 1. Header & Navigation */}
      <AdminHeader stats={stats} search={search} setSearch={setSearch} />

      <div className="flex justify-end items-center mb-6 gap-3">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-[#2B2F36] text-muted-foreground hover:text-white text-xs font-medium transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2a9d8f]' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        <p className="text-xs text-muted-foreground">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* 2. Main KPI Stats Cards */}
      <StatsGrid stats={stats} />

      {/* 3. Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <WeeklyChart data={stats?.weeklySubmissions} />
        <DifficultyChart stats={stats} />
      </div>

      {/* 4. Secondary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <ContestOverview stats={stats} />
        <QuickAnalytics stats={stats} />
        <SystemHealth stats={stats} />
      </div>

      {/* 5. Lists & Timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PendingReview recentPending={recentPending} stats={stats} search={search} />
        <ActivityTimeline stats={stats} />
      </div>
    </div>
  )
})
