'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function BadgeNotification({ badges, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (badges && badges.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(0)
    }
  }, [badges])

  const handleNext = useCallback(() => {
    if (currentIndex < badges.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }, [currentIndex, badges, onClose])

  // Auto-advance or close after 5 seconds
  useEffect(() => {
    if (!badges || badges.length === 0) return
    const timer = setTimeout(() => {
      handleNext()
    }, 5000)
    return () => clearTimeout(timer)
  }, [currentIndex, badges, handleNext])

  if (!badges || badges.length === 0) return null

  const currentBadge = badges[currentIndex]

  // Color mappings based on level
  let ringColor = 'ring-white/20'
  let textColor = 'text-foreground'
  if (currentBadge.level === 'BRONZE') {
    ringColor = 'ring-[#cd7f32]/50'
    textColor = 'text-[#cd7f32]'
  } else if (currentBadge.level === 'SILVER') {
    ringColor = 'ring-[#c0c0c0]/50'
    textColor = 'text-[#c0c0c0]'
  } else if (currentBadge.level === 'GOLD') {
    ringColor = 'ring-[#ffd700]/50'
    textColor = 'text-[#ffd700]'
  } else if (currentBadge.level === 'PLATINUM') {
    ringColor = 'ring-[#e5e4e2]/50'
    textColor = 'text-[#e5e4e2]'
  }

  return (
    <AnimatePresence>
      <motion.div
        key={currentBadge.id}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center p-6 bg-[#1e1e1e] border border-border rounded-2xl shadow-2xl overflow-hidden w-80"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 to-transparent pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
        >
          <X size={16} />
        </button>
        
        <div className="text-center mb-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-green-400 mb-1 block">
            🎉 Congratulations!
          </span>
          <span className="text-sm text-gray-400 block">
            You unlocked
          </span>
        </div>

        <motion.div 
          initial={{ rotate: -15, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.6 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 bg-[#2a2a2a] ring-2 ring-offset-4 ring-offset-[#1e1e1e] shadow-lg ${ringColor}`}
        >
          {currentBadge.icon}
        </motion.div>

        <div className="text-center relative z-10 w-full">
          <h3 className={`text-lg font-bold mb-1 truncate px-2 ${textColor}`}>
            {currentBadge.name}
          </h3>
          <p className="text-xs text-gray-400 px-4 mb-4">
            {currentBadge.description}
          </p>
          
          <button
            onClick={handleNext}
            className="w-full py-2 bg-[#2a2a2a] hover:bg-[#333] text-sm text-white font-medium rounded-lg transition-colors border border-[#3a3a3a]"
          >
            {currentIndex < badges.length - 1 ? 'Next Badge' : 'Awesome!'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
