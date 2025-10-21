type GlobalLoaderProps = {
  isLoading: boolean
}

export default function GlobalLoader({ isLoading }: GlobalLoaderProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700/30"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-white border-r-red-500 border-b-teal-400"></div>
          <div className="absolute inset-[6px] rounded-full bg-slate-950/60 backdrop-blur-sm"></div>
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-semibold text-white animate-pulse">Loading...</p>
          <p className="text-sm text-slate-400">Please wait while we fetch your data</p>
        </div>
      </div>
    </div>
  )
}
