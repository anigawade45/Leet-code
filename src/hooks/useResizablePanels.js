import { useState, useEffect } from 'react'

export function useResizablePanels() {
  const [leftWidth, setLeftWidth] = useState(41.6) // percentage width of description panel
  const [editorHeight, setEditorHeight] = useState(65) // percentage height of editor inside right pane
  const [isResizingWidth, setIsResizingWidth] = useState(false)
  const [isResizingHeight, setIsResizingHeight] = useState(false)

  const startResizingWidth = (e) => {
    e.preventDefault()
    setIsResizingWidth(true)
  }

  const startResizingHeight = (e) => {
    e.preventDefault()
    setIsResizingHeight(true)
  }

  // Handle Horizontal Resize
  useEffect(() => {
    if (!isResizingWidth) return

    const handleMouseMove = (e) => {
      const newWidth = (e.clientX / window.innerWidth) * 100
      if (newWidth >= 20 && newWidth <= 80) {
        setLeftWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingWidth(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingWidth])

  // Handle Vertical Resize
  useEffect(() => {
    if (!isResizingHeight) return

    const handleMouseMove = (e) => {
      const newHeight = (e.clientY / window.innerHeight) * 100
      if (newHeight >= 20 && newHeight <= 80) {
        setEditorHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizingHeight(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingHeight])

  return {
    leftWidth,
    editorHeight,
    isResizingWidth,
    isResizingHeight,
    startResizingWidth,
    startResizingHeight
  }
}
