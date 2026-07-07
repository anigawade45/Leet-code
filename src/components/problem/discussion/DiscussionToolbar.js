import React from 'react'
import { Search } from 'lucide-react'

export default function DiscussionToolbar({ search, sort, onSearchChange, onSortChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-border pb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          className="w-full bg-background border border-border/50 rounded-full pl-10 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          placeholder="Search discussions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span>Sort by:</span>
        <select 
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-background border border-border/50 rounded-lg px-3 py-1.5 text-foreground focus:outline-none cursor-pointer"
        >
          <option value="best">Most Liked</option>
          <option value="newest">Most Recent</option>
        </select>
      </div>
    </div>
  )
}
