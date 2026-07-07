import { memo } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export const NavItem = memo(function NavItem({ href, label, hasDropdown, pathname }) {
  const isActive = pathname === href || pathname?.startsWith(href + '/')
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-1 h-14 px-4 text-[15px] transition-colors relative ${
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      {hasDropdown && <ChevronDown size={16} />}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-md" />
      )}
    </Link>
  )
})
