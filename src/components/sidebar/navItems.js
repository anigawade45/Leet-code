import {
  Library, PlusSquare, ClipboardList,
  Swords, Compass, BookOpen, ShieldAlert
} from 'lucide-react'

export const mainNavItems = [
  {
    href: "/problems",
    icon: Library,
    label: "Library"
  },
  {
    href: "/create-problem",
    icon: PlusSquare,
    label: "Create Problem"
  },
  {
    href: "/submissions",
    icon: ClipboardList,
    label: "Submissions"
  },
  {
    href: "/coming-soon?feature=quest",
    icon: Swords,
    label: "Quest"
  },
  {
    href: "/coming-soon?feature=explore",
    icon: Compass,
    label: "Explore"
  },
  {
    href: "/coming-soon?feature=study-plan",
    icon: BookOpen,
    label: "Study Plan"
  }
]

export const adminNavItems = [
  {
    href: "/admin",
    icon: ShieldAlert,
    label: "Admin Panel",
    colorClasses: "text-[#f59e0b] hover:bg-[#f59e0b]/10 hover:text-[#fbbf24] border border-[#f59e0b]/20 bg-[#f59e0b]/5",
    activeColorClasses: "text-[#fbbf24] bg-[#f59e0b]/20 border border-[#f59e0b]/40"
  }
]
