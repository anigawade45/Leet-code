import { memo, useRef, useEffect } from 'react'
import { ProfileGrid } from './ProfileGrid'
import { ProfileLinks } from './ProfileLinks'

export const ProfileDropdown = memo(function ProfileDropdown({ user, onClose, onLogout }) {
  const menuRef = useRef(null)

  // Handle Escape and Tab (Focus Trap)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }

      if (e.key === 'Tab') {
        if (!menuRef.current) return

        const focusableElements = menuRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // Focus first element on mount
    if (menuRef.current) {
      const firstFocusable = menuRef.current.querySelector('a[href], button:not([disabled])')
      firstFocusable?.focus()
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 top-12 w-72 bg-card border border-border rounded-xl shadow-2xl py-3 z-50 text-sm origin-top-right animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="px-4 pb-3 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 bg-[#2a9d8f] rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-foreground font-semibold truncate">{user.username}</span>
          <span className="text-primary text-xs leading-tight">Access all features with our Premium subscription!</span>
        </div>
      </div>

      <ProfileGrid onClose={onClose} />
      
      <ProfileLinks user={user} onClose={onClose} onLogout={onLogout} />
    </div>
  )
})
