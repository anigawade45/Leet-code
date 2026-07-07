'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext({
  socket: null,
  isConnected: false
})

export const useSocketContext = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

    const socketInstance = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      console.log('[SocketProvider] Connected with ID:', socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('[SocketProvider] Disconnected')
      setIsConnected(false)
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
