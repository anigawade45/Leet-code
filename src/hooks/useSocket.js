'use client'

import { useEffect } from 'react'
import { useSocketContext } from '@/providers/SocketProvider'

export function useSocket(eventName, callback) {
  const { socket, isConnected } = useSocketContext()

  useEffect(() => {
    if (!socket || !eventName || !callback) return

    socket.on(eventName, callback)

    return () => {
      socket.off(eventName, callback)
    }
  }, [socket, eventName, callback])

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const joinRoom = (room) => {
    if (socket && isConnected) {
      socket.emit('join-room', room)
    }
  }

  const leaveRoom = (room) => {
    if (socket && isConnected) {
      socket.emit('leave-room', room)
    }
  }

  return { socket, isConnected, emit, joinRoom, leaveRoom }
}
