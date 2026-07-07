import Link from 'next/link'

export const NavItem = ({ href, icon: Icon, label, colorClasses, activeColorClasses, isCollapsed, active }) => {
  const defaultInactive = colorClasses || 'text-muted-foreground hover:bg-muted hover:text-white'
  const defaultActive = activeColorClasses || 'bg-muted text-white'
  
  const styling = active ? defaultActive : defaultInactive

  return (
    <Link
      href={href}
      className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-md transition-colors overflow-hidden whitespace-nowrap ${styling}`}
      title={isCollapsed ? label : undefined}
    >
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && <span className="font-semibold text-[15px]">{label}</span>}
    </Link>
  )
}
