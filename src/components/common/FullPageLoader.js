'use client'

import LoadingSpinner from './LoadingSpinner'

export default function FullPageLoader({
  message = "Loading...",
  fullScreen = true,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        fullScreen ? "min-h-screen" : "h-full min-h-[400px]"
      } bg-background flex flex-col items-center justify-center animate-in fade-in duration-500`}
    >
      <LoadingSpinner size="lg" />

      {message && (
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      )}

      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  )
}
