import { memo } from 'react'
import Image from 'next/image'

export const Avatar = memo(function Avatar({ user, size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl'
  }

  const dimensionMap = {
    sm: 28,
    md: 40,
    lg: 64
  }

  if (user?.avatarUrl) {
    return (
      <div className={`${sizeMap[size]} rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-card ${className}`}>
        <Image 
          src={user.avatarUrl} 
          alt={user.username || 'User'} 
          width={dimensionMap[size]} 
          height={dimensionMap[size]} 
          className="w-full h-full object-cover" 
        />
      </div>
    )
  }

  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U'

  return (
    <div className={`${sizeMap[size]} bg-[#2a9d8f] rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}>
      {initial}
    </div>
  )
})
