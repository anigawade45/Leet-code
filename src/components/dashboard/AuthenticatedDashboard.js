'use client'

import React from 'react'
import { ContestBanner } from './ContestBanner'
import { PostList } from './PostList'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

export function AuthenticatedDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1100px] mx-auto px-4 pt-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Main Feed */}
          <div className="flex-1 min-w-0">
            {/* Contests */}
            <ContestBanner />

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-8 px-2 border-b border-border/50 pb-8">
              <button 
                className="px-6 py-2 bg-foreground text-background font-semibold rounded-full hover:opacity-90 transition-opacity"
                aria-label="Discover more content"
              >
                Discover more
              </button>
              <button 
                className="px-6 py-2 bg-transparent text-primary font-semibold rounded-full border border-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                aria-label="Open Developer Tools"
              >
                <span className="opacity-80 text-xl font-normal leading-none mb-1">⊞</span> Developer Tools
              </button>
            </div>

            {/* Feed List */}
            <PostList />

            {/* Footer inside main feed area */}
            <Footer />
          </div>

          {/* Right Column: Widgets */}
          <Sidebar />

        </div>
      </div>
    </div>
  )
}
