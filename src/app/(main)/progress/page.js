'use client'

import React, { useEffect, useState } from 'react'
import { PracticeHistory } from '@/components/progress/PracticeHistory'
import { ProgressSummary } from '@/components/progress/ProgressSummary'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function ProgressPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/progress')
        if (!response.ok) {
          throw new Error('Failed to fetch progress data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[calc(100vh-56px)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-56px)] text-white">
        <div className="text-xl font-semibold mb-2">Error</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background min-h-[calc(100vh-56px)] text-white p-6 md:p-8 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Practice History */}
          <div className="flex-1 min-w-0 lg:w-[65%]">
            <PracticeHistory history={data.practiceHistory || []} />
          </div>

          {/* Right Column: Summary */}
          <div className="lg:w-[35%] flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-white mb-[-8px]">Summary</h2>
            <ProgressSummary 
              totalProblems={data.totalProblems}
              solvedProblems={data.solvedProblems}
              submissions={data.submissions}
              skillMatrix={data.skillMatrix}
              allSubmissions={data.allSubmissions}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
