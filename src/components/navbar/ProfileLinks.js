import { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { FlaskConical, ClipboardList, Code2, Settings, Moon, Sun, Monitor, LogOut, ChevronRight, ChevronLeft, LayoutDashboard, Check } from 'lucide-react'
import { useTheme } from 'next-themes'

export const ProfileLinks = memo(function ProfileLinks({ user, onClose, onLogout }) {
  const [view, setView] = useState('main')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (view === 'appearance') {
    return (
      <div className="py-2 animate-in slide-in-from-right-2 duration-200">
        <button onClick={() => setView('main')} className="w-full flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none font-medium">
          <ChevronLeft size={16} />
          <span>Appearance</span>
        </button>
        <div className="my-1 border-t border-border" />
        <button onClick={() => setTheme('light')} className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none">
          <div className="flex items-center gap-3">
            <Sun size={16} className="text-muted-foreground" />
            <span>Light</span>
          </div>
          {mounted && theme === 'light' && <Check size={16} className="text-primary" />}
        </button>
        <button onClick={() => setTheme('dark')} className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none">
          <div className="flex items-center gap-3">
            <Moon size={16} className="text-muted-foreground" />
            <span>Dark</span>
          </div>
          {mounted && theme === 'dark' && <Check size={16} className="text-primary" />}
        </button>
        <button onClick={() => setTheme('system')} className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none">
          <div className="flex items-center gap-3">
            <Monitor size={16} className="text-muted-foreground" />
            <span>System</span>
          </div>
          {mounted && theme === 'system' && <Check size={16} className="text-primary" />}
        </button>
      </div>
    )
  }

  return (
    <div className="py-2 animate-in slide-in-from-left-2 duration-200">
      {user?.role === 'ADMIN' && (
        <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-2 text-primary hover:bg-background hover:text-primary transition-colors focus:bg-background focus:text-primary outline-none font-medium bg-background/30">
          <LayoutDashboard size={16} className="text-primary" />
          <span>Admin Dashboard</span>
        </Link>
      )}
      <Link href="/coming-soon" onClick={onClose} className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none">
        <FlaskConical size={16} className="text-muted-foreground" />
        <span>Try New Features</span>
      </Link>
      <Link href="/coming-soon" onClick={onClose} className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none">
        <Code2 size={16} className="text-muted-foreground" />
        <span>My Playgrounds</span>
      </Link>
      <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none">
        <Settings size={16} className="text-muted-foreground" />
        <span>Settings</span>
      </Link>
      <button onClick={() => setView('appearance')} className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none cursor-pointer">
        <div className="flex items-center gap-3">
          {mounted && theme === 'light' ? <Sun size={16} className="text-muted-foreground" /> : <Moon size={16} className="text-muted-foreground" />}
          <span>Appearance</span>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>
      <button 
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors focus:bg-background focus:text-foreground outline-none mt-1 border-t border-border pt-3"
      >
        <LogOut size={16} className="text-muted-foreground" />
        <span>Sign Out</span>
      </button>
    </div>
  )
})
