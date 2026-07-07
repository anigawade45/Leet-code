'use client'

import React from 'react'
import { Snowflake } from 'lucide-react'
import { SkillMatrix } from './SkillMatrix'
import { ActivityChart } from './ActivityChart'

export function ProgressSummary({ totalProblems, solvedProblems, submissions, skillMatrix, allSubmissions }) {
  const getPercentage = (solved, total) => {
    if (!total || total === 0) return 0
    return ((solved / total) * 100).toFixed(1)
  }

  const beatsPercentage = 98.3 // Mocked as per screenshot for parity

  return (
    <div className="flex flex-col gap-4">
      {/* Rewind Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2a1b2e] via-[#1f1524] to-[#1e2a4a] p-5 h-[120px] shadow-lg border border-border/30">
        <div className="flex justify-between items-center h-full relative z-10">
          <div>
            <h2 className="text-4xl font-bold text-white mb-1">2025</h2>
            <div className="text-sm font-semibold text-foreground leading-tight">
              LeetCode<br/>Rewind
            </div>
          </div>
          <div className="text-[#e2e8f0] opacity-80 animate-pulse">
            <Snowflake size={64} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Total Solved Card */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-md">
        <div className="text-muted-foreground text-sm font-semibold mb-2">Total Solved</div>
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-[34px] font-bold text-[#3478f6] leading-none">{solvedProblems.total}</span>
            <span className="text-[15px] font-medium text-[#3478f6]/80">Problems</span>
          </div>
          <div className="text-muted-foreground text-[15px] font-medium flex items-center gap-1.5 pb-1">
            <span className="opacity-70">👋</span> Beats {beatsPercentage}%
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="flex-1 flex items-center justify-between bg-[#383838]/60 rounded-lg px-3 py-2">
            <span className="text-[#00b8a3]">Easy</span>
            <span className="text-white">{solvedProblems.EASY}</span>
          </div>
          <div className="flex-1 flex items-center justify-between bg-[#383838]/60 rounded-lg px-3 py-2">
            <span className="text-[#ffc01e]">Med.</span>
            <span className="text-white">{solvedProblems.MEDIUM}</span>
          </div>
          <div className="flex-1 flex items-center justify-between bg-[#383838]/60 rounded-lg px-3 py-2">
            <span className="text-[#ff375f]">Hard</span>
            <span className="text-white">{solvedProblems.HARD}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-md flex flex-col justify-center gap-2">
          <div className="text-muted-foreground text-[15px] font-medium">Submissions</div>
          <div className="text-[28px] font-semibold text-[#a855f7]">
            {submissions.total}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-md flex flex-col justify-center gap-2">
          <div className="text-muted-foreground text-[15px] font-medium">Acceptance</div>
          <div className="text-[28px] font-semibold text-[#2cbb5d] flex items-baseline gap-[1px]">
            {submissions.acceptanceRate}
            <span className="text-[20px] font-medium">%</span>
          </div>
        </div>
      </div>

      {/* Skill Matrix Bubble Chart */}
      <SkillMatrix data={skillMatrix} />

      {/* Activity Chart */}
      <ActivityChart submissions={allSubmissions || []} />
    </div>
  )
}
