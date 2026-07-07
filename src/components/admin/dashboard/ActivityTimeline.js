'use client'

import { Activity, Plus, CheckCircle, User, Trophy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function ActivityTimeline({ stats }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-2xl">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-[#f59e0b]" /> Live Activity
      </h2>
      <div className="space-y-6">
        {stats?.recentActivity?.length > 0 ? (
          stats.recentActivity.map((activity, i) => (
            <div key={i} className="flex gap-4 relative">
              {i !== stats.recentActivity.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-[#2B2F36]"></div>
              )}
              <div className="flex-shrink-0 z-10 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                {activity.type === 'PROBLEM_SUBMITTED' && <Plus className="w-3 h-3 text-yellow-500" />}
                {activity.type === 'PROBLEM_APPROVED' && <CheckCircle className="w-3 h-3 text-green-500" />}
                {activity.type === 'USER_REGISTERED' && <User className="w-3 h-3 text-blue-500" />}
                {activity.type === 'CONTEST_CREATED' && <Trophy className="w-3 h-3 text-purple-500" />}
              </div>
              <div className="flex-1 pb-1">
                <p className="text-sm text-white font-medium">{activity.text}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold tracking-wide">
                    {activity.date ? formatDistanceToNow(new Date(activity.date), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 opacity-50">
            <Activity className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground italic">No recent activity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
