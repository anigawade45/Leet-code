'use client'

import { ShieldCheck, Search, Bell, User } from 'lucide-react'

export function AdminHeader({ stats, search, setSearch }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2a9d8f] to-[#1a7a6e] flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Typo Round' }}>
            Good Morning, Admin 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Today there are <span className="text-[#f59e0b] font-bold">{stats?.pending || 0}</span> pending reviews, <span className="text-[#8b5cf6] font-bold">{stats?.contestStats?.running || 0}</span> contests running, and <span className="text-[#34d399] font-bold">{stats?.quickAnalytics?.todaySubmissions || 0}</span> submissions today.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Search Box */}
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search problems..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:border-[#2a9d8f] transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
