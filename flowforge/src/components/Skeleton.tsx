function Shimmer({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-100 dark:bg-[#1a1c26] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Shimmer className="h-8 w-64" />
          <Shimmer className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-9 w-28 rounded-lg" />
          <Shimmer className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-[#2a2c38] dark:bg-[#15171f]">
            <div className="flex items-center justify-between">
              <Shimmer className="h-8 w-8 rounded-lg" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
            <Shimmer className="mt-3 h-5 w-3/4" />
            <Shimmer className="mt-2 h-3 w-full" />
            <Shimmer className="mt-1 h-3 w-2/3" />
            <div className="mt-4">
              <Shimmer className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-[#e2e8f0] bg-white p-5 dark:border-[#2a2c38] dark:bg-[#15171f]">
          <Shimmer className="mb-4 h-5 w-24" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-[#f1f5f9] p-3 dark:border-[#2a2c38]">
                <Shimmer className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-7 rounded-2xl border border-[#e2e8f0] bg-white p-5 dark:border-[#2a2c38] dark:bg-[#15171f]">
          <Shimmer className="mb-4 h-5 w-32" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Shimmer className="h-7 w-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-3 w-full" />
                  <Shimmer className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-8 w-56" />
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-9 w-20 rounded-lg" />
          <Shimmer className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((col) => (
          <div key={col} className="rounded-2xl bg-[#f8fafc] p-2.5 dark:bg-[#0b0d12]">
            <div className="mb-4 flex items-center gap-2 px-1.5">
              <Shimmer className="h-2 w-2 rounded-full" />
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-5 w-6 rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((card) => (
                <div key={card} className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
                  <div className="mb-3 flex items-center justify-between">
                    <Shimmer className="h-5 w-16 rounded-full" />
                    <Shimmer className="h-4 w-4" />
                  </div>
                  <Shimmer className="h-4 w-3/4" />
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-[#2a2c38]">
                    <Shimmer className="h-3 w-12" />
                    <Shimmer className="h-5.5 w-5.5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Shimmer className="h-8 w-40" />
          <Shimmer className="h-4 w-32" />
        </div>
        <Shimmer className="h-9 w-32 rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="border-b border-[#e2e8f0] px-5 py-3 dark:border-[#2a2c38]">
          <div className="flex items-center gap-4">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-24" />
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-b border-[#e2e8f0] px-5 py-4 last:border-0 dark:border-[#2a2c38]">
            <div className="flex items-center gap-4">
              <Shimmer className="h-8 w-8 rounded-full" />
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-5 w-16 rounded-full" />
              <Shimmer className="h-4 w-12" />
              <Shimmer className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Shimmer className="h-8 w-32" />

      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Shimmer className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}