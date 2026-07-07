'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { NotificationBell } from './NotificationBell'
import { NavItem } from './NavItem'
import { SearchBar } from './SearchBar'
import { ProfileDropdown } from './ProfileDropdown'
import { MobileMenu } from './MobileMenu'
import { Avatar } from './Avatar'
import { Flame, Menu } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/problems', label: 'Problems' },
  { href: '/contest', label: 'Contest' },
  { href: '/discuss', label: 'Discuss' },
  { href: '/interview', label: 'Interview', hasDropdown: true },
  { href: '/store', label: 'Store', hasDropdown: true },
]

export function Navbar() {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()
  
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const profileContainerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = useCallback(() => {
    setShowProfileMenu(false)
    logout()
  }, [logout])

  const handleStreakClick = useCallback(async () => {
    try {
      const res = await fetch('/api/daily-challenge')
      if (res.ok) {
        const data = await res.json()
        if (data?.dailyChallenge?.slug) {
          window.location.href = `/problems/${data.dailyChallenge.slug}`
        }
      }
    } catch (e) {
      console.error('Failed to fetch daily challenge:', e)
    }
  }, [])

  return (
    <>
      <nav className="bg-card border-b border-border sticky top-0 z-50 transition-colors">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            
            {/* Left Side: Logo & Navigation */}
            <div className="flex items-center h-full">
              <Link href="/" className="flex items-center gap-1.5 mr-2 md:mr-6">
                <Image
                  src="/logo.png"
                  alt="LeetCode Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                />
                <span className="text-foreground font-semibold text-lg tracking-tight">LeetCode</span>
              </Link>
              
              {user && (
                <div className="hidden md:flex items-center h-full">
                  {NAV_ITEMS.map((item, i) => (
                    <NavItem 
                      key={i} 
                      href={item.href} 
                      label={item.label} 
                      hasDropdown={item.hasDropdown} 
                      pathname={pathname} 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Tools & Profile */}
            <div className="flex items-center gap-5">
              {user && <SearchBar />}

              <div className="flex items-center gap-4">
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : user ? (
                  <div className="flex items-center gap-4">
                    
                    <NotificationBell />

                    {user.streak !== undefined && (
                      <div 
                        onClick={handleStreakClick}
                        className={`hidden sm:flex items-center gap-1 font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity ${user.streak > 0 ? 'text-[#ff8c00]' : 'text-muted-foreground'}`}
                        title="Daily Streak (Click for today's challenge)"
                      >
                        <Flame 
                          size={20} 
                          className={user.streak > 0 
                            ? (user.hasSolvedToday ? "fill-[#ff8c00] text-[#ff8c00]" : "text-[#ff8c00] bg-transparent") 
                            : "text-muted-foreground"} 
                        />
                        <span>{user.streak}</span>
                      </div>
                    )}

                    <div className="relative" ref={profileContainerRef}>
                      <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                        aria-expanded={showProfileMenu}
                        aria-haspopup="true"
                        aria-label="Profile menu"
                      >
                        <Avatar user={user} size="sm" className="hover:opacity-90 transition-opacity" />
                      </button>

                      {showProfileMenu && (
                        <ProfileDropdown 
                          user={user} 
                          onClose={() => setShowProfileMenu(false)} 
                          onLogout={handleLogout} 
                        />
                      )}
                    </div>

                    <Link
                      href="/premium"
                      className="hidden sm:flex px-3 py-1 bg-[#ffa116]/10 text-[#ffa116] hover:bg-[#ffa116]/20 transition-colors rounded-md text-[13px] font-semibold items-center"
                    >
                      Premium
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button 
                      className="md:hidden p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                      onClick={() => setShowMobileMenu(true)}
                      aria-label="Open mobile menu"
                    >
                      <Menu size={24} />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium text-[14px]"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <MobileMenu 
        navItems={NAV_ITEMS}
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
      />
    </>
  )
}
