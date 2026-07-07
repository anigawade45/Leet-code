'use client'

import { TrendingUp, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

export function WeeklyChart({ data }) {
  const hasData = data && data.length > 0 && data.some(d => d.count > 0)

  return (
    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-2xl">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#2a9d8f]" /> Weekly Submissions
      </h2>
      <div className="h-64">
        {!hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-50">
            <BarChart2 className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No analytics available yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
              <XAxis dataKey="name" stroke="#888" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis stroke="#888" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                cursor={{fill: '#2B2F36'}}
                contentStyle={{ backgroundColor: '#0F1117', border: '1px solid #2B2F36', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#2a9d8f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
