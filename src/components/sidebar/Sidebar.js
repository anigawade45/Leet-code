'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ChevronsLeft, ChevronsRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { NavItem } from './NavItem'
import { mainNavItems, adminNavItems } from './navItems'

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [lists, setLists] = useState([])

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      try {
        setIsCollapsed(JSON.parse(stored))
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetch('/api/lists')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.lists) setLists(d.lists)
        })
        .catch(e => console.error('Failed to load lists in sidebar:', e))
    } else {
      setLists([])
    }
  }, [user])

  const toggleSidebar = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(nextState))
  }

  // To prevent hydration mismatch UI jumps, we render a static sidebar width on the server, 
  // and switch to the true state once mounted.
  const collapsedState = mounted ? isCollapsed : false

  return (
    <div
      className={`relative bg-background border-r border-border min-h-[calc(100vh-56px)] pt-4 pb-4 transition-all duration-300 flex flex-col flex-shrink-0 ${
        collapsedState ? 'w-[72px] items-center' : 'w-64 px-3'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        aria-label={collapsedState ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsedState}
        className="absolute -right-3 top-6 w-6 h-6 bg-[#3b82f6] hover:bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-md z-10 transition-colors"
      >
        {collapsedState ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
      </button>

      <nav className={`space-y-1 w-full ${collapsedState ? 'px-2' : ''}`}>
        {mainNavItems.map(item => (
          <NavItem
            key={item.label}
            {...item}
            isCollapsed={collapsedState}
            active={pathname === item.href}
          />
        ))}

        {/* Admin Panel — only visible to admins */}
        {user?.role === 'ADMIN' && (
          <>
            <div className={`my-3 border-t border-border/50 ${collapsedState ? 'mx-2' : ''}`}></div>
            {adminNavItems.map(item => (
              <NavItem
                key={item.label}
                {...item}
                isCollapsed={collapsedState}
                active={pathname === item.href}
              />
            ))}
          </>
        )}
      </nav>

      {/* My Lists Section */}
      {!collapsedState && (
        <div className="mt-8 w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">My Lists</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Create new list">
              <Plus size={16} />
            </button>
          </div>
          {lists.length > 0 ? (
            <div className="flex flex-col mt-2 space-y-1">
              {lists.map(list => (
                <Link 
                  key={list.id} 
                  href={`/problem-list/${user?.username}`} 
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-between rounded-md mx-2"
                >
                  <span className="truncate">{list.title}</span>
                  <span className="text-xs opacity-60 ml-2">{list._count?.problems || 0}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-6 text-muted-foreground">
              <p className="text-sm font-semibold mb-1">No lists yet</p>
              <p className="text-xs">Create your first list</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
