import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  List,
  Play,
  UploadCloud,
  Settings,
  Flame,
  Timer,
  LayoutGrid,
  Bug,
  Sparkles,
  File
} from 'lucide-react'

export function ProblemNavbar({ 
  problem, 
  user, 
  handleRunCode, 
  handleSubmitCode, 
  isRunning, 
  isSubmitting,
  onNotesClick
}) {
  return (
    <nav className="h-12 bg-card flex items-center justify-between px-4 border-b border-border/30 shrink-0 select-none">
      
      {/* Left side: Logo & Navigation */}
      <div className="flex items-center h-full gap-4">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="LeetCode Logo"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/problems" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/30 hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors">
            <List size={14} />
            Problem List
          </Link>
          
          <div className="flex items-center gap-1 bg-muted/30 rounded">
            <button className="p-1.5 text-foreground hover:bg-muted/50 rounded transition-colors" title="Previous Problem">
              <ChevronLeft size={16} />
            </button>
            <button className="p-1.5 text-foreground hover:bg-muted/50 rounded transition-colors" title="Next Problem">
              <ChevronRight size={16} />
            </button>
          </div>
          
          <button className="p-1.5 text-foreground hover:bg-muted/50 rounded transition-colors" title="Pick One">
            <Shuffle size={14} />
          </button>
        </div>
      </div>

      {/* Center: Execution & Submission Controls */}
      <div className="flex items-center h-full gap-2 absolute left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1 bg-muted/30 rounded p-1">
          <button className="p-1.5 text-foreground hover:bg-muted/50 rounded transition-colors" title="Debug">
            <Bug size={14} />
          </button>
          
          <button 
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1 text-foreground hover:bg-muted/50 rounded transition-colors text-[13px] font-semibold disabled:opacity-50"
          >
            <Play size={14} className={isRunning ? "animate-pulse" : ""} />
            Run
          </button>
          
          <button 
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1 text-[#2cbb5d] hover:bg-[#2cbb5d]/10 rounded transition-colors text-[13px] font-semibold disabled:opacity-50"
          >
            <UploadCloud size={14} className={isSubmitting ? "animate-pulse" : ""} />
            Submit
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={onNotesClick}
            className="p-1.5 text-foreground hover:bg-muted/50 rounded transition-colors" 
            title="Notes"
          >
            <File size={16} />
          </button>
          <button className="p-1.5 text-[#a259ff] hover:bg-[#a259ff]/10 rounded transition-colors" title="AI Assistant">
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {/* Right side: Tools & Profile */}
      <div className="flex items-center h-full gap-3">
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Layout Settings">
          <LayoutGrid size={16} />
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Settings">
          <Settings size={16} />
        </button>

        <div className="w-[1px] h-4 bg-muted"></div>

        <div className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-[#ff8c00] transition-colors group">
          <Flame size={16} className={user?.streak > 0 ? "text-[#ff8c00]" : ""} />
          <span className="text-[13px] font-semibold">{user?.streak || 0}</span>
        </div>

        <button className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors rounded text-[13px]">
          <Timer size={16} />
        </button>
        
        {user ? (
          <div className="flex items-center gap-3">
            <Link href={`/u/${user.username}`}>
              <div className="w-6 h-6 bg-[#2a9d8f] rounded-full flex items-center justify-center text-white text-[10px] font-semibold hover:opacity-90 transition-opacity">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </Link>
            <Link
              href="/premium"
              className="px-3 py-1 bg-[#ffa116]/10 text-[#ffa116] hover:bg-[#ffa116]/20 transition-colors rounded text-[13px] font-semibold"
            >
              Premium
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1 bg-muted/30 hover:bg-muted/50 transition-colors rounded text-[13px] font-semibold text-foreground"
          >
            Sign In
          </Link>
        )}
      </div>

    </nav>
  )
}
