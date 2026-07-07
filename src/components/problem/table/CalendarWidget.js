import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HelpCircle, CircleCheckBig } from 'lucide-react'

function useDailyCountdown() {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setHours(24, 0, 0, 0)
      const diff = tomorrow - now

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const m = Math.floor((diff / 1000 / 60) % 60)
      const s = Math.floor((diff / 1000) % 60)

      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  return timeLeft
}

export function CalendarWidget({ currentDate, setCurrentDate, calendarData }) {
  const isCurrentYearMonth = currentDate.getFullYear() === new Date().getFullYear() && currentDate.getMonth() === new Date().getMonth()
  const countdown = useDailyCountdown()

  return (
    <div className="w-full bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        {isCurrentYearMonth ? (
          <>
            <div className="text-foreground font-semibold flex items-center gap-2">
              Day {new Date().getDate()} <span className="text-xs text-muted-foreground font-normal">{countdown} left</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Previous Month"
              >
                &lt;
              </button>
            </div>
          </>
        ) : (
          <>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm font-semibold"
              aria-label="Go to Today"
            >
              &lt; Today
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className={`text-muted-foreground hover:text-foreground transition-colors p-1 ${
                  currentDate.getFullYear() === 2021 && currentDate.getMonth() === 0 ? 'invisible' : ''
                }`}
                aria-label="Previous Month"
              >
                &lt;
              </button>
              <div className="text-foreground font-semibold flex items-center text-sm">
                {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}
              </div>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Next Month"
              >
                &gt;
              </button>
            </div>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-muted-foreground">
        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {(() => {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const daysInPrevMonth = new Date(year, month, 0).getDate();
          
          return [...Array(35)].map((_, i) => {
            const dayOffset = i - firstDay + 1;
            const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;
            let dayNum = 0;
            if (!isCurrentMonth) {
              dayNum = dayOffset <= 0 ? daysInPrevMonth + dayOffset : dayOffset - daysInMonth;
            } else {
              dayNum = dayOffset;
            }

            const dateStr = isCurrentMonth 
              ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              : null;
            
            const dayData = dateStr ? calendarData[dateStr] : null;
            const isSolved = dayData?.isSolved;
            const hasChallenge = !!dayData;
            
            const realToday = new Date();
            const isRealToday = isCurrentMonth && realToday.getDate() === dayNum && realToday.getMonth() === month && realToday.getFullYear() === year;

            realToday.setHours(23, 59, 59, 999);
            const cellDate = new Date(year, month, dayNum);
            const isPastOrToday = isCurrentMonth && cellDate <= realToday;

            return (
              <div key={i} className="aspect-square flex flex-col items-center justify-center relative">
                {isCurrentMonth ? (
                  isSolved ? (
                    <Link href={`/problems/${dayData.slug}?envType=daily-question&envId=${dateStr}`} className="w-7 h-7 flex items-center justify-center text-blue-500 cursor-pointer hover:bg-blue-500/10 transition-colors relative z-10 rounded-full">
                      <CircleCheckBig size={24} strokeWidth={2.5} />
                    </Link>
                  ) : isRealToday ? (
                    <span className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-medium shadow-sm">
                      {hasChallenge ? <Link href={`/problems/${dayData.slug}?envType=daily-question&envId=${dateStr}`}>{dayNum}</Link> : dayNum}
                    </span>
                  ) : (
                    <span className={`text-foreground ${hasChallenge && !isSolved && isPastOrToday ? 'opacity-90' : ''}`}>
                      {hasChallenge ? <Link href={`/problems/${dayData.slug}?envType=daily-question&envId=${dateStr}`} className="hover:text-blue-400 cursor-pointer relative z-10 font-medium">{dayNum}</Link> : dayNum}
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground/50">{dayNum}</span>
                )}
                
                {isCurrentMonth && hasChallenge && !isSolved && isPastOrToday && !isRealToday && (
                  <div className="w-1 h-1 bg-red-500 rounded-full absolute bottom-1"></div>
                )}
              </div>
            );
          });
        })()}
      </div>
      
      <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
        <div className="flex items-center gap-2 text-orange-500 text-sm font-semibold mb-2">
          Weekly Premium <HelpCircle size={14} />
        </div>
        <div className="flex justify-between text-orange-500 text-xs">
          <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span>
        </div>
      </div>
    </div>
  )
}
