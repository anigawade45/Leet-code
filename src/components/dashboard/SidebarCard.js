import Link from 'next/link'

export function SidebarCard({ title, description, icon, href, buttonLabel }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border flex gap-4">
      {icon}
      <div className="flex flex-col justify-center flex-1">
        <h3 className="text-foreground font-bold text-[15px] mb-1">{title}</h3>
        <p className="text-muted-foreground text-[13px] mb-3 leading-tight">{description}</p>
        <Link href={href} className="inline-block px-4 py-1.5 bg-background hover:bg-background/80 text-foreground text-[13px] font-semibold rounded-lg transition-colors border border-border w-max">
          {buttonLabel}
        </Link>
      </div>
    </div>
  )
}
