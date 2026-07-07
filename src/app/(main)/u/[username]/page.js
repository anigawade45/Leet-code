'use client'

import { useState, useEffect, use } from 'react'
import { MapPin, Link as LinkIcon, Briefcase, Eye, CheckSquare, MessageSquare, Star, Settings, ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'

export default function ProfilePage({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const username = params?.username
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/profile?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProfile(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your profile.</h2>
      </div>
    )
  }
  
  const {
    user = {},
    streak = { currentStreak: 0, longestStreak: 0, lastSolved: null },
    solved = { total: 0, easy: 0, medium: 0, hard: 0, totalEasy: 1, totalMedium: 1, totalHard: 1 },
    activity = { heatmap: {}, totalSubmissions: 0, totalActiveDays: 0 }
  } = profile || {}

  const generateHeatmapData = (heatmapData) => {
    const months = []
    const today = new Date()
    
    // We want 12 months ending in the current month.
    let startMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1)

    for (let m = 0; m < 12; m++) {
      // Use UTC-based month start to avoid timezone shifts when converting to ISO dates
      const year = startMonth.getFullYear()
      const month = startMonth.getMonth() + m
      const monthDateUTC = new Date(Date.UTC(year, month, 1))
      const monthName = monthDateUTC.toLocaleString('default', { month: 'short' })
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

      const weeks = []
      let currentWeek = []

      // Pad the first week with nulls for days before the 1st (use UTC weekday)
      const startDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay() // 0 = Sunday
      for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push(null)
      }

      for (let d = 1; d <= daysInMonth; d++) {
        // Build the date at UTC midnight for the intended calendar day
        const date = new Date(Date.UTC(year, month, d))
        const dateStr = date.toISOString().split('T')[0]
        const count = heatmapData?.[dateStr] || 0
        
        let intensity = 0
        if (count === 1) intensity = 1
        if (count >= 2 && count <= 3) intensity = 2
        if (count >= 4 && count <= 5) intensity = 3
        if (count >= 6) intensity = 4
        
        // Future days will still render but with 0 intensity (grey square)
        // If we wanted future days invisible, we could change intensity or make it null. 
        // LeetCode renders the rest of the current month as grey squares.
        currentWeek.push({ count, intensity, dateStr })
        
        if (currentWeek.length === 7) {
          weeks.push(currentWeek)
          currentWeek = []
        }
      }
      
      // Pad the last week with nulls
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null)
        }
        weeks.push(currentWeek)
      }
      
      months.push({
        name: monthName,
        weeks
      })
    }
    
    return months
  }

  const heatmapMonths = generateHeatmapData(activity?.heatmap)

  const getHeatmapColor = (intensity) => {
    if (intensity === 0) return 'bg-muted/60' // Empty grid blocks
    if (intensity === 1) return 'bg-[#0e4429]'
    if (intensity === 2) return 'bg-[#006d32]'
    if (intensity === 3) return 'bg-[#26a641]'
    return 'bg-[#39d353]'
  }

  return (
    <div className="min-h-screen bg-background text-muted-foreground font-sans pb-12">
      <div className="w-full max-w-[1600px] px-8 py-8 flex gap-8">
        
        {/* === LEFT SIDEBAR === */}
        <div className="w-75 shrink-0 space-y-6">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg bg-card flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-3xl text-muted-foreground font-bold">{(user.username?.charAt(0) ?? '').toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{user.username || 'Unknown'}</h1>
              <p className="text-sm">Rank <span className="font-semibold text-white">324,125</span></p>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <span><span className="text-white font-medium">2</span> Following</span>
            <span><span className="text-white font-medium">1</span> Followers</span>
          </div>

          <button className="w-full py-2 bg-muted hover:bg-accent text-[#8bc34a] rounded-lg font-medium transition-colors">
            Edit Profile
          </button>

          <div className="space-y-4 text-sm pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <MapPin size={16} />
              <span>India</span>
            </div>
            <div className="flex items-center gap-3 hover:text-white cursor-pointer transition-colors">
              <LinkIcon size={16} />
              <span>{user.username || ''}</span>
            </div>
            <div className="flex items-center gap-3 hover:text-white cursor-pointer transition-colors">
              <Briefcase size={16} />
              <span>{user.username || ''}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-sm font-semibold text-white">Community Stats</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <Eye size={16} className="text-blue-400 group-hover:text-blue-300" />
                  <span>Views</span>
                </div>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <CheckSquare size={16} className="text-[#00b8a3] group-hover:text-[#00d1b9]" />
                  <span>Solution</span>
                </div>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <MessageSquare size={16} className="text-[#8bc34a] group-hover:text-[#9ccc65]" />
                  <span>Discuss</span>
                </div>
                <span className="text-white font-medium">0</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <Star size={16} className="text-[#ffc01e] group-hover:text-[#ffd54f]" />
                  <span>Reputation</span>
                </div>
                <span className="text-white font-medium">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="flex-1 min-w-0 space-y-6">
          
          {/* Top Row: Contest & Top % */}
          <div className="flex gap-6">
            <div className="flex-1 bg-card rounded-xl p-5 border border-border/30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-xs mb-1">Contest Rating</div>
                  <div className="text-3xl text-white font-medium">1,472</div>
                </div>
                <div>
                  <div className="text-xs mb-1">Global Ranking</div>
                  <div className="text-sm font-medium">
                    <span className="text-white">467,553</span>/874,587
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1">Attended</div>
                  <div className="text-sm font-medium text-white">2</div>
                </div>
              </div>
              {/* Mock Line Chart */}
              <div className="h-24 w-full relative">
                <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                  <path d="M0 50 L400 90" fill="none" stroke="#ffc01e" strokeWidth="2" />
                  <circle cx="0" cy="50" r="4" fill="#ffc01e" />
                  <circle cx="400" cy="90" r="4" fill="#ffc01e" />
                </svg>
                <div className="absolute bottom-0 w-full flex justify-between text-[10px]">
                  <span>Apr 2026</span>
                  <span>Apr 2026</span>
                </div>
              </div>
            </div>

            <div className="w-75 shrink-0 bg-card rounded-xl p-5 border border-border/30">
              <div className="text-xs mb-1">Top</div>
              <div className="text-3xl text-white font-medium mb-6">53.92%</div>
              {/* Mock Bar Chart */}
              <div className="h-24 flex items-end gap-1">
                {[2,4,6,3,5,8,30,45,25,18,12,8,6,4,3,2,1,1,1,1,1,1,1,1].map((val, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm ${i === 7 ? 'bg-[#ffc01e]' : 'bg-muted'}`} 
                    style={{ height: `${val}%` }} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Middle Row: Solved & Badges */}
          <div className="flex gap-6">
            <div className="flex-1 bg-card rounded-xl p-5 border border-border/30 flex items-center gap-8">
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#3e424a" strokeWidth="4" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#00b8a3" strokeWidth="4" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * Math.min(solved.easy, solved.totalEasy || 1) / (solved.totalEasy || 1))} />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#ffc01e" strokeWidth="4" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * Math.min(solved.medium, solved.totalMedium || 1) / (solved.totalMedium || 1))} className="rotate-[-120deg] origin-center" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#ff375f" strokeWidth="4" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * Math.min(solved.hard, solved.totalHard || 1) / (solved.totalHard || 1))} className="rotate-[-240deg] origin-center" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <div className="text-3xl text-white font-medium">{solved.total}</div>
                  <div className="text-[10px]">Solved</div>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="bg-muted/30 rounded-lg p-2.5 px-4 flex items-center justify-between text-sm">
                  <span className="text-[#00b8a3]">Easy</span>
                  <span className="text-white font-medium">{solved.easy}<span className="text-muted-foreground font-normal">/{solved.totalEasy}</span></span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5 px-4 flex items-center justify-between text-sm">
                  <span className="text-[#ffc01e]">Med.</span>
                  <span className="text-white font-medium">{solved.medium}<span className="text-muted-foreground font-normal">/{solved.totalMedium}</span></span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2.5 px-4 flex items-center justify-between text-sm">
                  <span className="text-[#ff375f]">Hard</span>
                  <span className="text-white font-medium">{solved.hard}<span className="text-muted-foreground font-normal">/{solved.totalHard}</span></span>
                </div>
              </div>
            </div>

            <div className="w-75 shrink-0 bg-card rounded-xl p-5 border border-border/30 flex flex-col">
              <div className="text-sm mb-1">Badges</div>
              <div className="text-3xl text-white font-medium mb-4">{user.userBadges?.length || 0}</div>
              
              <div className="flex flex-wrap gap-3 mb-4 overflow-y-auto max-h-30 pr-2 custom-scrollbar">
                {user.userBadges?.length > 0 ? (
                  user.userBadges.map(({ badge }) => {
                    let ringColor = 'border-border bg-background'
                    if (badge.level === 'BRONZE') ringColor = 'border-[#cd7f32]/50 bg-[#cd7f32]/10'
                    if (badge.level === 'SILVER') ringColor = 'border-[#c0c0c0]/50 bg-[#c0c0c0]/10'
                    if (badge.level === 'GOLD') ringColor = 'border-[#ffd700]/50 bg-[#ffd700]/10'
                    if (badge.level === 'PLATINUM') ringColor = 'border-[#e5e4e2]/50 bg-[#e5e4e2]/10'
                    
                    return (
                      <div 
                        key={badge.id} 
                        title={`${badge.name} - ${badge.description}`}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-help ${ringColor}`}
                      >
                        <span className="text-2xl">{badge.icon}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-xs text-gray-500">No badges earned yet.</div>
                )}
              </div>

              {user.userBadges?.length > 0 && (
                <div className="mt-auto pt-2 border-t border-border/30">
                  <div className="text-[10px] text-gray-400">Most Recent Badge</div>
                  <div className="text-sm text-white font-medium truncate" title={user.userBadges[user.userBadges.length - 1].badge.name}>
                    {user.userBadges[user.userBadges.length - 1].badge.name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Heatmap & Streak */}
          <div className="bg-card rounded-xl p-5 border border-border/30">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-white font-medium">{activity?.totalSubmissions || 0}</span> submissions in the past one year
              </div>
              <div className="flex items-center gap-6 text-sm relative">
                <div>Total active days: <span className="text-white font-medium">{activity?.totalActiveDays || 0}</span></div>
                <div>Max streak: <span className="text-white font-medium">{streak.longestStreak}</span></div>
                <div className="relative">
                  <button 
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    className="flex items-center gap-2 bg-muted/30 hover:bg-muted/50 text-white px-3 py-1.5 rounded-md transition-colors"
                  >
                    Current <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                  {isYearDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden z-10">
                      <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 text-white text-sm transition-colors">
                        Current <Check size={14} className="text-blue-500" />
                      </button>
                      <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 text-muted-foreground text-sm transition-colors">
                        2025
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mb-2 overflow-x-auto pb-2 items-end">
              {heatmapMonths.map((month, mIndex) => (
                <div key={mIndex} className="flex flex-col gap-2 shrink-0">
                  <div className="flex gap-1">
                    {month.weeks.map((week, wIndex) => (
                      <div key={wIndex} className="flex flex-col gap-1">
                        {week.map((day, dIndex) => {
                          if (!day) return <div key={dIndex} className="w-3 h-3" /> // Invisible padding
                          return (
                            <div 
                              key={dIndex} 
                              className={`w-3 h-3 rounded-xs ${getHeatmapColor(day.intensity)} transition-colors hover:ring-1 hover:ring-white/50`}
                              title={`${day.count} submissions on ${day.dateStr}`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center w-full">
                    {month.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
