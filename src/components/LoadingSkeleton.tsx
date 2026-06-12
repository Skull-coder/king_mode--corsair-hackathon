"use client";

/**
 * Skeleton loader for email list rows in dark mode.
 */
export function EmailListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-5 bg-[#151821] border border-gray-800/80 rounded-2xl">
          {/* Avatar Skeleton */}
          <div className="w-11 h-11 rounded-full bg-gray-800 flex-shrink-0" />
          
          {/* Content Skeleton */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-3 py-1">
            <div className="flex justify-between items-center">
              <div className="w-32 h-3.5 bg-gray-800 rounded" />
              <div className="w-16 h-3 bg-gray-800 rounded" />
            </div>
            <div className="w-2/3 h-3.5 bg-gray-800 rounded" />
            <div className="w-1/2 h-3 bg-gray-800/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for email detail view in dark mode.
 */
export function EmailDetailSkeleton() {
  return (
    <div className="animate-pulse p-8 bg-[#0e1116] min-h-screen">
      <div className="w-32 h-4 bg-gray-800 rounded mb-8" />
      <div className="w-3/4 h-8 bg-gray-800 rounded mb-6" />
      <div className="flex gap-3 mb-8">
        <div className="w-20 h-6 bg-[#151821] rounded-full" />
        <div className="w-24 h-6 bg-[#151821] rounded-full" />
      </div>
      
      <div className="border-t border-gray-800 pt-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-800" />
          <div className="space-y-2">
            <div className="w-48 h-4 bg-gray-800 rounded" />
            <div className="w-32 h-3 bg-gray-800/50 rounded" />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="w-full h-4 bg-gray-800/50 rounded" />
        <div className="w-5/6 h-4 bg-gray-800/50 rounded" />
        <div className="w-4/6 h-4 bg-gray-800/50 rounded" />
        <div className="w-full h-4 bg-gray-800/50 rounded" />
        <div className="w-3/4 h-4 bg-gray-800/50 rounded" />
      </div>
    </div>
  );
}