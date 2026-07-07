import { Lightbulb } from 'lucide-react'

export function SolutionsPanel() {
  return (
    <div className="p-6 text-center py-10 text-muted-foreground">
      <Lightbulb size={32} className="mx-auto mb-2 text-muted-foreground/50" />
      <p className="font-semibold text-sm">Community Solutions</p>
      <p className="text-xs mt-1">Explore discussions and code snippets from other members.</p>
    </div>
  )
}
