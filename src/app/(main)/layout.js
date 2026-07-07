'use client'

import { Navbar } from '@/components/navbar/Navbar'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import FullPageLoader from '@/components/common/FullPageLoader'
import { usePathname } from 'next/navigation'

export default function MainLayout({ children }) {
  const { loading, user } = useAuth()
  const pathname = usePathname()

  if (loading) {
    return <FullPageLoader />
  }

  if (!user) {
    return null // Let middleware handle redirect
  }

  // Check if we are in a dynamic problem workspace (e.g. /problems/two-sum)
  const isProblemWorkspace = pathname.startsWith('/problems/') && pathname !== '/problems'
  const isProfilePage = pathname.startsWith('/u/')
  const isNotesPage = pathname.startsWith('/notes')
  const isProgressPage = pathname.startsWith('/progress')

  if (isProblemWorkspace) {
    return (
      <div className="h-screen w-screen bg-background overflow-hidden flex flex-col">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        {!isProfilePage && !isNotesPage && !isProgressPage && <Sidebar />}
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
