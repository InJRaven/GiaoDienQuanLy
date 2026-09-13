import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RolesSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-5 items-start min-h-[calc(100vh-210px)]">
      {/* Left Column: Role List Skeleton (4 cols lg, 3 cols xl) */}
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 h-full">
        <Card className="border border-border h-full flex flex-col shadow-xs">
          {/* Card Header */}
          <CardHeader className="p-4 pb-3 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4.5 rounded" />
                <Skeleton className="h-4.5 w-16 rounded" />
                <Skeleton className="h-4 w-6 rounded-full" />
              </div>
              <Skeleton className="h-8 w-22 rounded-md" />
            </div>
            {/* Search Input */}
            <Skeleton className="h-8 w-full rounded-md" />
          </CardHeader>

          {/* Role Cards List */}
          <CardContent className="p-3 flex-1 overflow-y-auto space-y-2.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-border/70 space-y-2.5 bg-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  {idx === 1 && <Skeleton className="h-4.5 w-14 rounded-full" />}
                </div>

                <Skeleton className="h-3 w-44 rounded" />

                <div className="flex items-center gap-2 pt-0.5">
                  <Skeleton className="h-3.5 w-16 rounded" />
                  <Skeleton className="size-1 rounded-full" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Permission Matrix Skeleton (8 cols lg, 9 cols xl) */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 h-full">
        <Card className="border border-border h-full flex flex-col shadow-xs">
          {/* Matrix Header */}
          <CardHeader className="p-4 pb-3 border-b border-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-5.5 w-40 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4.5 w-16 rounded-full" />
                  <Skeleton className="h-4.5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-64 sm:w-80 rounded" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>

            {/* Matrix Filter Bar */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Skeleton className="h-8 w-64 max-w-sm rounded-md" />
              <Skeleton className="h-4 w-36 rounded hidden sm:block" />
            </div>
          </CardHeader>

          {/* Matrix Modules List */}
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
            {[1, 2, 3].map((moduleIdx) => (
              <div
                key={moduleIdx}
                className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs"
              >
                {/* Module Header Bar */}
                <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-16 rounded hidden sm:inline" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded hidden sm:inline" />
                  </div>
                </div>

                {/* Module Permissions Grid */}
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((permIdx) => (
                    <div
                      key={permIdx}
                      className="p-3 rounded-lg border border-border/70 flex items-start gap-2.5 bg-background"
                    >
                      <Skeleton className="size-4 rounded shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-28 rounded" />
                          {permIdx === 1 && (
                            <Skeleton className="h-4 w-14 rounded-full" />
                          )}
                        </div>
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-3 w-40 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>

          {/* Sticky Bottom Action Bar Skeleton */}
          <div className="p-3.5 border-t border-border bg-card/95 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Skeleton className="h-4 w-48 rounded" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
