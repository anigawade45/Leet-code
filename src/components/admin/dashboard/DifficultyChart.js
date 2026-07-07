'use client'

import { useMemo } from 'react'
import CountUp from 'react-countup'
import { PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

const PIE_COLORS = ['#34d399', '#f59e0b', '#ef4444']; // Easy, Medium, Hard

export function DifficultyChart({ stats }) {
  const pieData = useMemo(() => [
    { name: 'Easy', value: stats?.problemsByDifficulty?.easy || 0 },
    { name: 'Medium', value: stats?.problemsByDifficulty?.medium || 0 },
    { name: 'Hard', value: stats?.problemsByDifficulty?.hard || 0 }
  ], [stats])

  const totalPie = pieData.reduce((a, b) => a + b.value, 0) || 1 // avoid div by 0

  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-2xl flex flex-col">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5 text-[#f59e0b]" /> Problems by Difficulty
      </h2>
      <div className="flex-1 flex flex-col justify-center">
        <div className="h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: '#0F1117', border: '1px solid #2B2F36', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold"><CountUp end={stats?.total || 0} /></span>
            <span className="text-xs text-muted-foreground">Problems</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {pieData.map((entry, idx) => (
            <div key={idx} className="text-center p-2 rounded-lg bg-background border border-border">
              <p className="text-xs font-medium" style={{color: PIE_COLORS[idx]}}>{entry.name}</p>
              <p className="text-lg font-bold mt-1">{Math.round((entry.value / totalPie) * 100)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
