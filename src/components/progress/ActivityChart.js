'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, 
  format
} from 'date-fns'

export function ActivityChart({ submissions = [] }) {
  const [mode, setMode] = useState('Solved') // 'Solved' or 'Submissions'
  const [granularity, setGranularity] = useState('Daily') // 'Daily', 'Weekly', 'Monthly'
  const [showGranularityMenu, setShowGranularityMenu] = useState(false)
  const [showDateMenu, setShowDateMenu] = useState(false)
  
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1) // 1-12
  
  // Refs for clicking outside menus
  const dateMenuRef = useRef(null)
  const granMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target)) {
        setShowDateMenu(false)
      }
      if (granMenuRef.current && !granMenuRef.current.contains(event.target)) {
        setShowGranularityMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  // Calculate chart data
  const chartData = useMemo(() => {
    let relevantSubmissions = submissions
    if (mode === 'Solved') {
      const solvedMap = new Map()
      submissions.forEach(sub => {
        if (sub.status === 'ACCEPTED') {
          if (!solvedMap.has(sub.problem.id)) {
            solvedMap.set(sub.problem.id, sub)
          } else {
            if (new Date(sub.createdAt) < new Date(solvedMap.get(sub.problem.id).createdAt)) {
              solvedMap.set(sub.problem.id, sub)
            }
          }
        }
      })
      relevantSubmissions = Array.from(solvedMap.values())
    }

    let intervals = []
    
    if (granularity === 'Daily') {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = endOfMonth(startDate)
      intervals = eachDayOfInterval({ start: startDate, end: endDate }).map(day => ({
        label: format(day, 'MM.dd'),
        start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0),
        end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)
      }))
    } else if (granularity === 'Weekly') {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = endOfMonth(startDate)
      
      let current = startDate
      let weekNum = 1
      while (current <= endDate) {
        let weekEnd = new Date(current)
        // End the week on Saturday (6) or the end of the month
        const daysToSaturday = 6 - current.getDay()
        weekEnd.setDate(current.getDate() + daysToSaturday)
        if (weekEnd > endDate) weekEnd = endDate
        
        intervals.push({
          label: `W${weekNum}`,
          start: new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0),
          end: new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59)
        })
        
        current = new Date(weekEnd)
        current.setDate(current.getDate() + 1)
        weekNum++
      }
    } else if (granularity === 'Monthly') {
      // For monthly, we show the months of the selected year up to the current month (if current year)
      const endM = selectedYear === today.getFullYear() ? today.getMonth() : 11
      for (let m = 0; m <= endM; m++) {
        const monthStart = new Date(selectedYear, m, 1)
        intervals.push({
          label: format(monthStart, 'MMM'),
          start: monthStart,
          end: endOfMonth(monthStart)
        })
      }
    }

    const bars = intervals.map(interval => {
      const subs = relevantSubmissions.filter(sub => {
        const d = new Date(sub.createdAt)
        return d >= interval.start && d <= interval.end
      })
      
      const easy = subs.filter(s => s.problem.difficulty === 'EASY').length
      const med = subs.filter(s => s.problem.difficulty === 'MEDIUM').length
      const hard = subs.filter(s => s.problem.difficulty === 'HARD').length
      const total = subs.length
      
      return { label: interval.label, easy, med, hard, total }
    })

    const totalEasy = bars.reduce((acc, bar) => acc + bar.easy, 0)
    const totalMed = bars.reduce((acc, bar) => acc + bar.med, 0)
    const totalHard = bars.reduce((acc, bar) => acc + bar.hard, 0)
    const totalSubmissions = bars.reduce((acc, bar) => acc + bar.total, 0)
    const maxTotal = bars.reduce((acc, bar) => Math.max(acc, bar.total), 0)

    let yMax = Math.ceil(maxTotal / 5) * 5
    if (yMax < 10) yMax = 10

    return { bars, yMax, totalEasy, totalMed, totalHard, totalSubmissions }
  }, [submissions, mode, selectedYear, selectedMonth, granularity]) // Added granularity to dependencies

  // Dynamic constraints for Date Picker
  const availableYears = [today.getFullYear() - 1, today.getFullYear()]
  const availableMonths = Array.from(
    { length: selectedYear === today.getFullYear() ? today.getMonth() + 1 : 12 }, 
    (_, i) => i + 1
  )
  
  // Ensure we don't have an invalid month selected if year changes to current year
  useEffect(() => {
    if (selectedYear === today.getFullYear() && selectedMonth > today.getMonth() + 1) {
      setSelectedMonth(today.getMonth() + 1)
    }
  }, [selectedYear])

  return (
    <div className="bg-[#212121] rounded-2xl border border-border p-5 shadow-md flex flex-col mb-8">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-8">
        
        {/* Toggle Switch */}
        <div className="flex bg-[#2d2d2d] rounded-full p-1 border border-[#3e3e3e]">
          <button 
            onClick={() => setMode('Solved')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'Solved' ? 'bg-[#4a4a4a] text-white shadow-sm' : 'text-[#a0a0a0] hover:text-white'}`}
          >
            Solved
          </button>
          <button 
            onClick={() => setMode('Submissions')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'Submissions' ? 'bg-[#4a4a4a] text-white shadow-sm' : 'text-[#a0a0a0] hover:text-white'}`}
          >
            Submissions
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          
          {/* Granularity Dropdown */}
          <div className="relative" ref={granMenuRef}>
            <button 
              onClick={() => setShowGranularityMenu(!showGranularityMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[#4a4a4a] rounded-full text-sm text-[#e0e0e0] hover:bg-[#2d2d2d] transition-colors font-medium"
            >
              <span>{granularity.charAt(0)}</span>
              <ChevronDown size={14} className="text-[#a0a0a0]" />
            </button>
            {showGranularityMenu && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-[#2d2d2d] border border-[#3e3e3e] rounded-xl shadow-xl z-30 py-1">
                {['Daily', 'Weekly', 'Monthly'].map(option => (
                  <button 
                    key={option}
                    onClick={() => { setGranularity(option); setShowGranularityMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-[#e0e0e0] hover:bg-[#3e3e3e] transition-colors"
                  >
                    <span>{option}</span>
                    {granularity === option && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Period Dropdown */}
          <div className="relative" ref={dateMenuRef}>
            <button 
              onClick={() => setShowDateMenu(!showDateMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[#4a4a4a] rounded-full text-sm text-[#e0e0e0] hover:bg-[#2d2d2d] transition-colors font-medium"
            >
              <span>{selectedYear}-{selectedMonth}</span>
              <ChevronDown size={14} className="text-[#a0a0a0]" />
            </button>
            {showDateMenu && (
              <div className="absolute right-0 top-full mt-2 bg-[#2d2d2d] border border-[#3e3e3e] rounded-xl shadow-xl z-30 flex overflow-hidden max-h-[240px]">
                {/* Year Column */}
                <div className="w-20 border-r border-[#3e3e3e] flex flex-col p-1.5 overflow-y-auto">
                  {availableYears.map(y => (
                    <button 
                      key={y} 
                      onClick={() => setSelectedYear(y)} 
                      className={`px-3 py-2 text-left text-[15px] rounded-md transition-colors ${selectedYear === y ? 'bg-[#4a4a4a] text-white' : 'text-[#e0e0e0] hover:bg-[#3e3e3e]'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                {/* Month Column */}
                <div className="w-16 flex flex-col p-1.5 overflow-y-auto custom-scrollbar">
                  {availableMonths.map(m => (
                    <button 
                      key={m} 
                      onClick={() => { setSelectedMonth(m); setShowDateMenu(false); }} 
                      className={`px-3 py-2 text-left text-[15px] rounded-md transition-colors ${selectedMonth === m ? 'bg-[#4a4a4a] text-white' : 'text-[#e0e0e0] hover:bg-[#3e3e3e]'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-[220px] w-full flex items-end">
        {/* Y Axis Grid Lines & Labels */}
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none pb-8">
          <div className="flex items-center w-full">
            <div className="flex-1 border-t border-[#3e3e3e] mr-4 relative top-[7px]" />
            <span className="w-4 text-right font-medium">{chartData.yMax}</span>
          </div>
          <div className="flex items-center w-full">
            <div className="flex-1 border-t border-[#3e3e3e] mr-4 relative top-[7px]" />
            <span className="w-4 text-right font-medium">{chartData.yMax / 2}</span>
          </div>
          <div className="flex items-center w-full">
            <div className="flex-1 border-t border-[#3e3e3e] mr-4 relative top-[7px]" />
            <span className="w-4 text-right font-medium">0</span>
          </div>
        </div>

        {/* Bars */}
        <div className="flex-1 h-full pt-[14px] pb-[46px] flex items-end justify-between pl-1 pr-10 z-10">
          {chartData.bars.length === 0 || chartData.totalSubmissions === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-semibold">
              No data
            </div>
          ) : (
            chartData.bars.map((bar, i) => {
              const heightPct = (bar.total / chartData.yMax) * 100
              const hardPct = bar.total > 0 ? (bar.hard / bar.total) * 100 : 0
              const medPct = bar.total > 0 ? (bar.med / bar.total) * 100 : 0
              const easyPct = bar.total > 0 ? (bar.easy / bar.total) * 100 : 0

              // Adjust bar width based on granularity to look nice
              const barWidthClass = granularity === 'Monthly' ? 'w-4 sm:w-6' : granularity === 'Weekly' ? 'w-3 sm:w-4' : 'w-1.5 sm:w-2'

              return (
                <div key={i} className={`flex flex-col justify-end items-center group relative ${barWidthClass}`} style={{ height: `${heightPct}%` }}>
                  {/* Tooltip */}
                  {bar.total > 0 && (
                    <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                      <div className="bg-[#2d2d2d] rounded-lg p-2.5 shadow-xl flex flex-col gap-0.5 min-w-[70px]">
                        <div className="font-bold text-white text-[13px]">{bar.label}</div>
                        {mode === 'Solved' ? (
                          <>
                            {bar.easy > 0 && <div className="text-[13px] text-white flex gap-1"><span className="text-[#00b8a3]">Easy</span>{bar.easy}</div>}
                            {bar.med > 0 && <div className="text-[13px] text-white flex gap-1"><span className="text-[#ffc01e]">Med.</span>{bar.med}</div>}
                            {bar.hard > 0 && <div className="text-[13px] text-white flex gap-1"><span className="text-[#ff375f]">Hard</span>{bar.hard}</div>}
                          </>
                        ) : (
                          <div className="text-[13px] text-white flex gap-1"><span className="text-white/70">Subs</span>{bar.total}</div>
                        )}
                      </div>
                      <div className="w-2.5 h-2.5 bg-[#2d2d2d] rotate-45 -mt-1.5 shadow-xl" />
                    </div>
                  )}
                  
                  {bar.total > 0 && (
                    <div className="w-full h-full rounded-t-sm overflow-hidden flex flex-col transition-all group-hover:brightness-125 group-hover:opacity-100 opacity-90 cursor-pointer">
                      {mode === 'Solved' ? (
                        <>
                          {bar.hard > 0 && <div className="w-full bg-[#ff375f]" style={{ height: `${hardPct}%` }} />}
                          {bar.med > 0 && <div className="w-full bg-[#ffc01e]" style={{ height: `${medPct}%` }} />}
                          {bar.easy > 0 && <div className="w-full bg-[#00b8a3]" style={{ height: `${easyPct}%` }} />}
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#3478f6]" />
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        
        {/* X Axis Labels */}
        <div className="absolute bottom-3 left-0 right-10 flex justify-between items-center text-xs text-muted-foreground font-medium pl-1">
          {granularity === 'Monthly' ? (
            <>
              <span>Jan</span>
              <span>{format(new Date(selectedYear, availableMonths[availableMonths.length - 1] - 1, 1), 'MMM')}</span>
            </>
          ) : (
            <>
              <span>{format(new Date(selectedYear, selectedMonth - 1, 1), 'MM.dd')}</span>
              <span>{format(endOfMonth(new Date(selectedYear, selectedMonth - 1, 1)), 'MM.dd')}</span>
            </>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-2">
        {mode === 'Solved' ? (
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#00b8a3] text-[15px] font-medium">Easy</span>
              <span className="text-[#a0a0a0] text-[15px]">{chartData.totalEasy}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#ffc01e] text-[15px] font-medium">Med.</span>
              <span className="text-[#a0a0a0] text-[15px]">{chartData.totalMed}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#ff375f] text-[15px] font-medium">Hard</span>
              <span className="text-[#a0a0a0] text-[15px]">{chartData.totalHard}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-white text-[15px] font-medium">Total</span>
            <span className="text-[#a0a0a0] text-[15px]">{chartData.totalSubmissions}</span>
          </div>
        )}
      </div>
    </div>
  )
}
