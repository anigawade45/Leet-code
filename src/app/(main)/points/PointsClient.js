'use client'

import React, { useState, useEffect } from 'react'

export function PointsClient() {
  const [pointsData, setPointsData] = useState({ leetCoins: 0, history: [] })
  const [pointsLoading, setPointsLoading] = useState(false)

  const fetchPointsData = async () => {
    setPointsLoading(true)
    try {
      const res = await fetch('/api/settings/points')
      const data = await res.json()
      if (data.success) {
        setPointsData({ leetCoins: data.leetCoins, history: data.history })
      }
    } catch (err) {
      console.error('Failed to fetch points data:', err)
    } finally {
      setPointsLoading(false)
    }
  }

  useEffect(() => {
    fetchPointsData()
  }, [])

  return (
    <div className="max-w-[700px] mx-auto py-12 px-4">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-white">Your Points: </h2>
          <span className="text-xl font-bold text-[#ffa116]">🪙 {pointsData.leetCoins.toLocaleString()}</span>
        </div>
        <p className="text-[#8c8c8c] text-[13px] mb-8">
          Practice to earn more points. Redeem exciting rewards. <span className="text-blue-500 cursor-pointer hover:underline">Redeem</span>
        </p>

        <h3 className="text-[#8c8c8c] text-sm mb-4">History</h3>
        
        <div className="flex flex-col gap-2">
          {pointsLoading ? (
            <p className="text-[#8c8c8c] text-sm">Loading history...</p>
          ) : pointsData.history.length === 0 ? (
            <p className="text-[#8c8c8c] text-sm">No points history yet.</p>
          ) : (
            pointsData.history.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[#282828] border border-[#3e3e3e]/50">
                <div>
                  <p className="text-white font-medium text-[15px] mb-1">{item.title}</p>
                  <p className="text-[#8c8c8c] text-xs">
                    {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-white font-semibold">
                  +{item.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
