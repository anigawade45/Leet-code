'use client'

import React, { useState, useEffect } from 'react'
import { ExternalLink, User, Mail, Key, ArrowRight, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function SettingsClient() {
  const { user, checkAuth } = useAuth()
  const [activeTab, setActiveTab] = useState('Account')
  
  // Modal states
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBlockedModal, setShowBlockedModal] = useState(false)

  // Form states
  const [newUsername, setNewUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [blockUsername, setBlockUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [blockedUsers, setBlockedUsers] = useState([])

  // Privacy toggles state
  const [hideFollowingList, setHideFollowingList] = useState(user?.hideFollowingList || false)
  const [hideFollowerList, setHideFollowerList] = useState(user?.hideFollowerList || false)

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_username', newUsername: newUsername.trim() })
      })
      const data = await res.json()
      if (data.success) {
        await checkAuth() // Refresh user context
        setShowUsernameModal(false)
      } else {
        setError(data.message || data.error || 'Failed to update username')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_password', currentPassword, newPassword })
      })
      const data = await res.json()
      if (data.success) {
        setShowPasswordModal(false)
        setCurrentPassword('')
        setNewPassword('')
      } else {
        setError(data.message || data.error || 'Failed to update password')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/settings', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/'
      } else {
        setError(data.message || data.error || 'Failed to delete account')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePrivacy = async (field, value) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_privacy',
          hideFollowingList: field === 'following' ? value : hideFollowingList,
          hideFollowerList: field === 'follower' ? value : hideFollowerList,
        })
      })
      if (res.ok) {
        if (field === 'following') setHideFollowingList(value)
        if (field === 'follower') setHideFollowerList(value)
        checkAuth()
      }
    } catch (err) {
      console.error('Failed to update privacy:', err)
    }
  }

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/settings/block')
      const data = await res.json()
      if (data.success) {
        setBlockedUsers(data.blockedUsers)
      }
    } catch (err) {
      console.error('Failed to fetch blocked users:', err)
    }
  }

  const handleBlockUser = async () => {
    if (!blockUsername.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/settings/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: blockUsername.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setBlockUsername('')
        fetchBlockedUsers() // Refresh list
      } else {
        setError(data.message || data.error || 'Failed to block user')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblockUser = async (userId) => {
    try {
      const res = await fetch(`/api/settings/block?userId=${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchBlockedUsers() // Refresh list
      }
    } catch (err) {
      console.error('Failed to unblock user:', err)
    }
  }

  const tabs = [
    { id: 'Account', label: 'Account' },
    { id: 'Privacy', label: 'Privacy' }
  ]

  return (
    <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8 flex gap-8 items-start">
      
      {/* Left Sidebar */}
      <div className="w-[280px] shrink-0 p-5 pl-0">
        <h1 className="text-2xl font-bold text-white mb-6 pl-4">Settings</h1>
        
        <div className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (!tab.isExternal) setActiveTab(tab.id)
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                activeTab === tab.id && !tab.isExternal
                  ? 'bg-[#2d2d2d] text-white'
                  : 'text-[#e5e5e5] hover:bg-[#2d2d2d] hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.isExternal && <ExternalLink size={16} className="text-[#8c8c8c]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-[500px]">
        {activeTab === 'Account' && (
          <div className="max-w-[700px]">
            
            {/* General Section */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-1">General</h2>
              <p className="text-[#8c8c8c] text-[13px] mb-4">You can log in using your email, phone number, or LeetCode ID.</p>
              
              <div className="border border-[#2d2d2d] rounded-xl bg-[#282828]/30 overflow-hidden">
                {/* LeetCode ID */}
                <div onClick={() => { setNewUsername(user?.username || ''); setError(''); setShowUsernameModal(true); }} className="flex items-center justify-between px-6 py-4 hover:bg-[#2d2d2d] cursor-pointer group transition-colors border-b border-[#2d2d2d]">
                  <div className="flex items-center gap-4">
                    <User size={18} className="text-[#8c8c8c]" />
                    <div>
                      <span className="font-semibold text-white mr-2 text-[15px]">LeetCode ID</span>
                      <span className="text-[#8c8c8c] text-[15px]">{user?.username}</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-[#8c8c8c] group-hover:text-white transition-colors" />
                </div>
                
                {/* Email (Read-only for now) */}
                <div className="flex items-center justify-between px-6 py-4 hover:bg-[#2d2d2d] cursor-pointer group transition-colors border-b border-[#2d2d2d]">
                  <div className="flex items-center gap-4">
                    <Mail size={18} className="text-[#8c8c8c]" />
                    <div>
                      <span className="font-semibold text-white mr-2 text-[15px]">Email</span>
                      <span className="text-[#8c8c8c] text-[15px]">
                        {user?.email?.includes('@') 
                          ? user.email.replace(/(.{3})(.*)(@.*)/, '$1****$3') 
                          : user?.email}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-[#8c8c8c] group-hover:text-white transition-colors" />
                </div>

                {/* Password */}
                <div onClick={() => { setError(''); setShowPasswordModal(true); }} className="flex items-center justify-between px-6 py-4 hover:bg-[#2d2d2d] cursor-pointer group transition-colors">
                  <div className="flex items-center gap-4">
                    <Key size={18} className="text-[#8c8c8c]" />
                    <div>
                      <span className="font-semibold text-white mr-2 text-[15px]">Password</span>
                      <span className="text-[#8c8c8c] text-[15px]">********</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-[#8c8c8c] group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

            {/* Danger Zone Section */}
            <div className="mb-10 mt-12">
              <h2 className="text-lg font-semibold text-white mb-4">Danger Zone</h2>

              <div className="border border-[#2d2d2d] rounded-xl bg-[#282828]/30 overflow-hidden">
                <div onClick={() => { setError(''); setShowDeleteModal(true); }} className="flex items-center justify-between px-6 py-4 hover:bg-[#2d2d2d] cursor-pointer group transition-colors">
                  <div className="flex items-center gap-4 text-[#ff375f]">
                    <Trash2 size={18} />
                    <span className="font-semibold text-[15px]">Delete Account</span>
                  </div>
                  <ArrowRight size={18} className="text-[#8c8c8c] group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
            
          </div>
        )}

        {activeTab === 'Privacy' && (
          <div className="max-w-[700px]">
            {/* Profile Visibility */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-1">Profile Visibility</h2>
              <p className="text-[#8c8c8c] text-[13px] mb-4">We respect your privacy and never share your data without consent.</p>
              
              <div className="border border-[#2d2d2d] rounded-xl bg-[#282828]/30 overflow-hidden">
                {/* Hide following list */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#2d2d2d]">
                  <div className="flex items-center gap-4">
                    <User size={18} className="text-[#8c8c8c]" />
                    <span className="font-semibold text-white text-[15px]">Hide my following list</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdatePrivacy('following', !hideFollowingList)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${hideFollowingList ? 'bg-white' : 'bg-[#3e3e3e]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black absolute transition-transform ${hideFollowingList ? 'translate-x-[22px]' : 'translate-x-[4px] bg-[#8c8c8c]'}`} />
                    </button>
                    <span className="text-white text-sm font-semibold w-6">{hideFollowingList ? 'On' : 'Off'}</span>
                  </div>
                </div>

                {/* Hide follower list */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-4">
                    <User size={18} className="text-[#8c8c8c]" />
                    <span className="font-semibold text-white text-[15px]">Hide my follower list</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdatePrivacy('follower', !hideFollowerList)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${hideFollowerList ? 'bg-white' : 'bg-[#3e3e3e]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black absolute transition-transform ${hideFollowerList ? 'translate-x-[22px]' : 'translate-x-[4px] bg-[#8c8c8c]'}`} />
                    </button>
                    <span className="text-white text-sm font-semibold w-6">{hideFollowerList ? 'On' : 'Off'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Block Section */}
            <div className="mb-10 mt-12">
              <h2 className="text-lg font-semibold text-white mb-1">Block</h2>
              <p className="text-[#8c8c8c] text-[13px] mb-4">View the blocked accounts.</p>

              <div className="border border-[#2d2d2d] rounded-xl bg-[#282828]/30 overflow-hidden">
                <div onClick={() => { fetchBlockedUsers(); setError(''); setShowBlockedModal(true); }} className="flex items-center justify-between px-6 py-5 hover:bg-[#2d2d2d] cursor-pointer group transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-5 flex justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8c8c8c]"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                    </div>
                    <span className="font-semibold text-white text-[15px]">Blocked accounts</span>
                  </div>
                  <ArrowRight size={18} className="text-[#8c8c8c] group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Modals */}
      
      {/* Update Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[500px] bg-[#282828] border border-[#3e3e3e] rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Update your LeetCode ID</h2>
            
            <input 
              type="text" 
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-[#3e3e3e]/30 border border-[#4a4a4a] text-white rounded-lg px-4 py-3 mb-2 focus:outline-none focus:border-[#8c8c8c] transition-colors"
              placeholder="Username"
            />
            <p className="text-[#8c8c8c] text-sm mb-6">Only one change is allowed every 90 days.</p>
            
            {error && <p className="text-[#ff375f] text-sm mb-4">{error}</p>}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowUsernameModal(false)}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-semibold text-white bg-[#3e3e3e] hover:bg-[#4a4a4a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateUsername}
                disabled={loading || !newUsername.trim() || newUsername === user?.username}
                className="px-6 py-2 rounded-lg font-semibold text-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[500px] bg-[#282828] border border-[#3e3e3e] rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Password</h2>
            
            <div className="mb-4">
              <label className="block text-[#a0a0a0] text-sm mb-2">Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#3e3e3e]/30 border border-[#4a4a4a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#8c8c8c] transition-colors"
              />
            </div>

            <div className="mb-2">
              <label className="block text-[#a0a0a0] text-sm mb-2">New Password (Please sign in again after setup)</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#3e3e3e]/30 border border-[#4a4a4a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#8c8c8c] transition-colors"
              />
            </div>
            
            <p className="text-[#8c8c8c] text-sm mb-6">At least 8 characters with a mix of letters and numbers, no special characters.</p>
            
            {error && <p className="text-[#ff375f] text-sm mb-4">{error}</p>}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button 
                onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); }}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-semibold text-white bg-[#3e3e3e] hover:bg-[#4a4a4a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdatePassword}
                disabled={loading || !currentPassword || !newPassword}
                className="px-6 py-2 rounded-lg font-semibold text-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[500px] bg-[#282828] border border-[#3e3e3e] rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Delete Account</h2>
            
            <p className="text-[#e5e5e5] mb-6">
              Are you sure you want to delete your account? This action is <strong className="text-[#ff375f]">permanent</strong> and cannot be undone. All your progress, submissions, and data will be lost.
            </p>
            
            {error && <p className="text-[#ff375f] text-sm mb-4">{error}</p>}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-semibold text-white bg-[#3e3e3e] hover:bg-[#4a4a4a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-semibold text-white bg-[#ff375f] hover:bg-[#ff375f]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Accounts Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[500px] bg-[#282828] border border-[#3e3e3e] rounded-xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Blocked Accounts</h2>
              <button onClick={() => setShowBlockedModal(false)} className="text-[#8c8c8c] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <input 
                type="text" 
                value={blockUsername}
                onChange={(e) => setBlockUsername(e.target.value)}
                className="flex-1 bg-[#3e3e3e]/30 border border-[#4a4a4a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#8c8c8c] transition-colors text-sm"
                placeholder="Type a username to block..."
              />
              <button 
                onClick={handleBlockUser}
                disabled={loading || !blockUsername.trim()}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-[#ff375f] hover:bg-[#ff375f]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Block
              </button>
            </div>

            {error && <p className="text-[#ff375f] text-sm mb-4">{error}</p>}

            <div className="flex-1 overflow-y-auto">
              {blockedUsers.length === 0 ? (
                <p className="text-[#8c8c8c] text-center py-4">No blocked accounts.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {blockedUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-[#3e3e3e] bg-[#333]">
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-[#8c8c8c]" />
                        <span className="text-white font-medium text-sm">{u.username}</span>
                      </div>
                      <button 
                        onClick={() => handleUnblockUser(u.id)}
                        className="text-[13px] font-semibold text-[#a0a0a0] hover:text-white transition-colors"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
