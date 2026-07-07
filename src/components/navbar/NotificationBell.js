'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2, Trophy, AlertCircle, Info, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useSocket } from '@/hooks/useSocket'

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef(null)

  useClickOutside(dropdownRef, () => setShowDropdown(false))

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.notifications) setNotifications(data.notifications)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useSocket('notification:new', (payload) => {
    setNotifications(prev => [payload, ...prev])
  })

  const clearNotifications = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' })
      setNotifications([])
      setShowDropdown(false)
    } catch (e) {
      console.error(e)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="text-muted-foreground hover:text-foreground transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-background"></span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-8 right-0 w-80 bg-card border border-border rounded-lg shadow-2xl py-2 z-50">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <h3 className="text-foreground font-semibold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={clearNotifications} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Trash2 size={12} /> Clear all
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm tracking-widest animate-pulse">
                •••
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => {
                let Icon = Info
                let iconColor = 'text-blue-400'
                if (notif.type === 'success') { Icon = CheckCircle2; iconColor = 'text-green-400' }
                if (notif.type === 'warning') { Icon = AlertCircle; iconColor = 'text-yellow-400' }
                if (notif.title.toLowerCase().includes('badge')) { Icon = Trophy; iconColor = 'text-[#ffc01e]' }

                const Content = () => (
                  <div className="flex gap-3 items-start px-4 py-3 hover:bg-background transition-colors border-b border-border/50">
                    <div className={`mt-0.5 ${iconColor}`}><Icon size={16} /></div>
                    <div>
                      <h4 className="text-foreground text-sm font-medium">{notif.title}</h4>
                      <p className="text-muted-foreground text-xs mt-1">{notif.message}</p>
                      <span className="text-muted-foreground/70 text-[10px] mt-2 block">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )

                if (notif.link) {
                  return (
                    <Link href={notif.link} key={notif.id} onClick={() => setShowDropdown(false)}>
                      <Content />
                    </Link>
                  )
                }

                return <div key={notif.id}><Content /></div>
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
