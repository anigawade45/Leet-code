import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'

export function ProblemStats({ stats }) {
  if (!stats) return null

  const items = [
    { label: 'Total Problems', value: stats.total || 0, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Pending Review', value: stats.pending || 0, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Approved', value: stats.approved || 0, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Rejected', value: stats.rejected || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <div key={i} className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
            <div className={`p-3 rounded-lg ${item.bg} ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold">{item.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
