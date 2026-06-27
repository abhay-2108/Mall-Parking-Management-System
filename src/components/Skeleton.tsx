export function CardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 bg-gray-200 rounded-full w-24 animate-shimmer" />
          <div className="h-8 bg-gray-200 rounded-full w-16 animate-shimmer" />
          <div className="h-3 bg-gray-200 rounded-full w-20 animate-shimmer" />
        </div>
        <div className="p-4 bg-gray-200 rounded-2xl animate-shimmer h-16 w-16" />
      </div>
    </div>
  )
}

export function RevenueSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-pulse">
      <div className="flex items-center mb-8">
        <div className="p-4 bg-gray-200 rounded-2xl mr-6 h-16 w-16 animate-shimmer" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-full w-32 animate-shimmer" />
          <div className="h-4 bg-gray-200 rounded-full w-24 animate-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-6 bg-gray-100 rounded-2xl space-y-3">
            <div className="h-8 w-8 bg-gray-200 rounded animate-shimmer mx-auto" />
            <div className="h-3 bg-gray-200 rounded-full w-20 mx-auto animate-shimmer" />
            <div className="h-8 bg-gray-200 rounded-full w-24 mx-auto animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 p-4 bg-gray-100 rounded-xl">
          <div className="h-4 bg-gray-200 rounded-full w-1/4 animate-shimmer" />
          <div className="h-4 bg-gray-200 rounded-full w-1/6 animate-shimmer" />
          <div className="h-4 bg-gray-200 rounded-full w-1/6 animate-shimmer" />
          <div className="h-4 bg-gray-200 rounded-full w-1/4 animate-shimmer" />
        </div>
      ))}
    </div>
  )
}
