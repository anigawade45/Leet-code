'use client'

export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  }

  return (
    <div className={`flex items-center ${gapClasses[size]}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-[#9da0a5] rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  )
}
