import { memo } from 'react'
import Link from 'next/link'
import { X, LayoutDashboard } from 'lucide-react'

export const MobileMenu = memo(function MobileMenu({ navItems, isOpen, onClose, user }) {
  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-[280px] bg-card border-l border-border z-[70] lg:hidden flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-foreground">Menu</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col p-4 gap-2 overflow-y-auto">
          {user?.role === 'ADMIN' && (
            <Link 
              href="/admin" 
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-lg text-foreground hover:bg-background transition-colors font-medium border border-border bg-background/50"
            >
              <LayoutDashboard size={18} className="text-primary" />
              Admin Dashboard
            </Link>
          )}

          <div className="h-px bg-border my-2" />

          {navItems.map((item, i) => (
            <Link 
              key={i}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
})
