'use client'

import { Star, Play, Plus, Edit2, MoreHorizontal, Globe, Lock, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AddQuestionsModal } from './AddQuestionsModal'
import { EditListModal } from './EditListModal'

export function UserListSidebar({ list }) {
  const { title, username, problems, progress } = list
  const router = useRouter()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreRef = useRef(null)

  const [isPublic, setIsPublic] = useState(list.isPublic || false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setIsMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePractice = () => {
    if (!problems || problems.length === 0) return
    const randomIdx = Math.floor(Math.random() * problems.length)
    const randomSlug = problems[randomIdx].slug
    if (randomSlug) {
      router.push(`/problems/${randomSlug}`)
    }
  }

  const handlePrivacyToggle = async () => {
    try {
      const res = await fetch(`/api/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic })
      })
      if (res.ok) {
        setIsPublic(!isPublic)
        setIsMoreOpen(false)
      }
    } catch (e) {
      console.error('Failed to toggle privacy', e)
    }
  }

  const refreshPage = () => {
    router.refresh()
  }

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const solvedPercent = progress.total === 0 ? 0 : (progress.solved / progress.total) * 100
  
  // 3/4 circle (270 degrees) arc
  const arcLength = circumference * 0.75
  const progressArcLength = arcLength * (solvedPercent / 100)
  const offset = arcLength - progressArcLength

  return (
    <div className="w-[320px] shrink-0 bg-[#282828] rounded-xl p-5 shadow-none border-none">
      
      {/* Header section */}
      <div className="mb-6">
        <div className="w-[72px] h-[72px] bg-[#f8f8f8] rounded-2xl flex items-center justify-center mb-4">
          <Star className="text-[#ffa116] fill-[#ffa116] w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1.5">{title}</h1>
        <div className="text-[13px] text-[#e5e5e5] mb-6">
          <span className="font-medium">{username}</span> <span className="text-[#8c8c8c]">• {problems.length} questions</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handlePractice}
            disabled={problems.length === 0}
            className="flex-1 bg-white text-black hover:bg-gray-100 font-semibold py-2 rounded-full flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
          >
            <Play size={15} className="fill-black" />
            Practice
          </button>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="w-10 h-10 rounded-full bg-[#3e3e3e] flex items-center justify-center hover:bg-[#4e4e4e] text-[#b3b3b3] hover:text-white transition-colors"
          >
            <Plus size={18} />
          </button>
          <button 
            onClick={() => setIsEditOpen(true)}
            className="w-10 h-10 rounded-full bg-[#3e3e3e] flex items-center justify-center hover:bg-[#4e4e4e] text-[#b3b3b3] hover:text-white transition-colors"
          >
            <Edit2 size={16} />
          </button>
          
          <div className="relative" ref={moreRef}>
            <button 
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="w-10 h-10 rounded-full bg-[#3e3e3e] flex items-center justify-center hover:bg-[#4e4e4e] text-[#b3b3b3] hover:text-white transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {isMoreOpen && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-[#282828] border border-border/50 rounded-xl shadow-2xl py-1 z-10 overflow-hidden">
                <button 
                  onClick={handlePrivacyToggle}
                  className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                >
                  {isPublic ? (
                    <>
                      <Lock size={16} />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe size={16} />
                      Make Public
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-[#3e3e3e] mb-6" />

      {/* Progress section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">Progress</h2>
          <button className="text-[#8c8c8c] hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 bg-[#333333] rounded-lg flex flex-col items-center justify-center relative min-h-[150px]">
            <svg className="w-[100px] h-[100px]" style={{ transform: 'rotate(135deg)' }}>
              <circle 
                cx="50" cy="50" r={radius} fill="none" 
                stroke="#464646" strokeWidth="3" 
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />
              <circle 
                cx="50" cy="50" r={radius} fill="none" 
                stroke="#2cbb5d" strokeWidth="3" 
                strokeDasharray={`${arcLength} ${circumference}`} 
                strokeDashoffset={offset} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-2">
              <div className="text-[28px] font-medium text-white leading-none tracking-tight">
                {progress.solved}<span className="text-base text-[#8c8c8c] font-normal">/{progress.total}</span>
              </div>
              <div className="text-[11px] text-white mt-1.5 flex items-center gap-1">
                <Check size={12} className="text-[#2cbb5d]" strokeWidth={3} />
                Solved
              </div>
            </div>
            <div className="text-[12px] text-[#8c8c8c] absolute bottom-3">0 Attempting</div>
          </div>

          <div className="w-[72px] flex flex-col gap-2">
            <div className="bg-[#333333] rounded-lg py-2 flex flex-col items-center justify-center text-xs h-[46px]">
              <span className="text-[#00b8a3] font-medium mb-0.5">Easy</span>
              <span className="text-white font-medium">
                {progress.easy.total > 0 ? (
                  <>{progress.easy.solved}<span className="text-[#8c8c8c]">/{progress.easy.total}</span></>
                ) : (
                  '0'
                )}
              </span>
            </div>
            <div className="bg-[#333333] rounded-lg py-2 flex flex-col items-center justify-center text-xs h-[46px]">
              <span className="text-[#ffc01e] font-medium mb-0.5">Med.</span>
              <span className="text-white font-medium">
                {progress.medium.total > 0 ? (
                  <>{progress.medium.solved}<span className="text-[#8c8c8c]">/{progress.medium.total}</span></>
                ) : (
                  '0'
                )}
              </span>
            </div>
            <div className="bg-[#333333] rounded-lg py-2 flex flex-col items-center justify-center text-xs h-[46px]">
              <span className="text-[#ff375f] font-medium mb-0.5">Hard</span>
              <span className="text-white font-medium">
                {progress.hard.total > 0 ? (
                  <>{progress.hard.solved}<span className="text-[#8c8c8c]">/{progress.hard.total}</span></>
                ) : (
                  '0'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AddQuestionsModal 
        list={list} 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onAdd={refreshPage} 
      />
      
      <EditListModal 
        list={list} 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        onSave={refreshPage} 
      />

    </div>
  )
}
