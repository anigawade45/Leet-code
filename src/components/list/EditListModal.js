'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function EditListModal({ list, isOpen, onClose, onSave }) {
  const [title, setTitle] = useState(list?.title || '')
  const [description, setDescription] = useState(list?.description || '')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })
      if (res.ok) {
        const data = await res.json()
        onSave(data.list)
        onClose()
      } else {
        console.error('Failed to update list')
      }
    } catch (error) {
      console.error('Error saving list', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#282828] w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/10">
          <h2 className="text-lg font-semibold text-white">Edit list info</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-white">Title</label>
            <div className="relative">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 30))}
                className="w-full bg-[#3e3e3e] border border-transparent focus:border-blue-500 rounded-lg px-3 py-2 text-white outline-none transition-colors"
                placeholder="Favorite"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {title.length}/30
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-white">Description</label>
            <div className="relative">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 150))}
                className="w-full h-24 bg-[#3e3e3e] border border-transparent focus:border-blue-500 rounded-lg px-3 py-2 text-white outline-none transition-colors resize-none"
                placeholder="Describe your list"
              />
              <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {description.length}/150
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-end gap-3 pt-0">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 rounded-full transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="px-4 py-1.5 text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-50 rounded-full transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  )
}
