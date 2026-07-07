import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({ title, description, backLink, actionLink }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        {backLink && (
          <Link href={backLink.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" /> {backLink.label}
          </Link>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      
      {actionLink && (
        <Link
          href={actionLink.href}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
        >
          {actionLink.icon && <actionLink.icon className="w-4 h-4" />}
          {actionLink.label}
        </Link>
      )}
    </div>
  )
}
