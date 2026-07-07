import Link from 'next/link'
import { Trophy, MessageCircle, Coins } from 'lucide-react'
import { SidebarCard } from './SidebarCard'

export function Sidebar() {
  return (
    <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
      {/* Crash Course Banner */}
      <Link href="/coming-soon" className="block relative w-full h-[150px] rounded-xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 p-5 flex flex-col">
          <h3 className="text-white text-[22px] font-bold leading-tight mb-1 font-sans">
            LeetCode&apos;s Interview<br/>Crash Course:
          </h3>
          <p className="text-white/90 text-[13px] font-medium mb-auto">Data Structures and Algorithms</p>
          <div className="inline-block px-4 py-1.5 bg-white text-black text-sm font-semibold rounded-full w-max hover:bg-gray-100 transition-colors shadow">
            Start Learning
          </div>
        </div>
      </Link>

      {/* LeetCode Contest Card */}
      <SidebarCard 
        title="LeetCode Contest"
        description={<>Participate and<br/>win prizes.</>}
        href="/contest"
        buttonLabel="Join Contest"
        icon={
          <div className="flex items-start justify-center pr-2">
            <Trophy size={48} className="text-[#ffa116]" strokeWidth={1.5} />
          </div>
        }
      />

      {/* Discuss Now Card */}
      <SidebarCard 
        title="Discuss Now"
        description={<>Share interview questions.<br/>Get solutions.</>}
        href="/discuss"
        buttonLabel="Let's Discuss"
        icon={
          <div className="w-16 h-16 bg-[#2cbb5d] rounded-full shrink-0 flex items-center justify-center relative shadow-[0_0_15px_rgba(44,187,93,0.3)]">
            <MessageCircle className="text-white fill-white" size={32} />
          </div>
        }
      />

      {/* Shop with LeetCoins Card */}
      <SidebarCard 
        title="Shop with LeetCoins"
        description={<>Use your points in our<br/>LeetCode Store.</>}
        href="/store"
        buttonLabel="Redeem"
        icon={
          <div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffa116] rounded-full shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(255,161,22,0.3)] border border-[#ffa116]/50">
            <Coins className="text-white opacity-50" size={36} strokeWidth={1} />
          </div>
        }
      />
    </div>
  )
}
