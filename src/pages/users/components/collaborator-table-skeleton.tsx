import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CollaboratorTableSkeleton() {
  return (
    <Card className="border border-border shadow-xs">
      {/* Header Skeleton */}
      <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card w-full">
        {/* Left: Search + Filter Skeleton */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <Skeleton className="h-9 w-full sm:w-72 rounded-md" />
          <Skeleton className="h-9 w-44 rounded-md" />
        </div>
        {/* Right: Actions Skeleton */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* Table Skeleton */}
      <CardTable>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="py-2.5 px-4 min-w-50 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Cộng tác viên
                </th>
                <th className="py-2.5 px-4 min-w-37.5 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="py-2.5 px-4 min-w-55 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="py-2.5 px-3 w-27.5 min-w-26.25 max-w-28.75 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider text-center">
                  Trạng thái
                </th>
                <th className="py-2.5 px-3 w-27.5 min-w-26.25 max-w-28.75 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider text-center">
                  Ngày tạo
                </th>
                <th className="py-2.5 px-2 w-13.75 min-w-12.5 max-w-15 text-center font-bold text-foreground text-xs uppercase tracking-wider">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border hover:bg-muted/40 transition-colors"
                >
                  <td className="py-3 px-4 border-e border-border">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-8 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-e border-border">
                    <Skeleton className="h-4 w-24 rounded" />
                  </td>
                  <td className="py-3 px-4 border-e border-border">
                    <Skeleton className="h-4 w-44 rounded" />
                  </td>
                  <td className="py-3 px-3 w-[110px] border-e border-border text-center">
                    <Skeleton className="h-5 w-20 rounded-full mx-auto" />
                  </td>
                  <td className="py-3 px-3 w-[110px] border-e border-border text-center">
                    <Skeleton className="h-4 w-16 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-2 w-[55px] text-center">
                    <div className="flex justify-center">
                      <Skeleton className="h-7 w-10 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardTable>

      {/* Footer Skeleton */}
      <CardFooter className="py-3 px-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </CardFooter>
    </Card>
  );
}
