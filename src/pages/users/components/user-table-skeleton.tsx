import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UserTableSkeleton() {
  return (
    <Card className="border border-border shadow-xs">
      {/* Header Skeleton */}
      <div className="p-5 border-b border-border flex flex-col gap-3.5 bg-card w-full">
        {/* Row 1: Search (Left) and Actions (Right) */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-9 w-full sm:w-80 rounded-md" />
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>

        {/* Row 2: Filter Controls (Left) and Total (Right) */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8.5 w-36 sm:w-40 rounded-md" />
            <Skeleton className="h-8.5 w-36 sm:w-40 rounded-md" />
            <Skeleton className="h-8.5 w-40 sm:w-44 rounded-md" />
            <Skeleton className="h-8.5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-5 w-28 rounded-md hidden md:block" />
        </div>
      </div>

      {/* Table Skeleton */}
      <CardTable>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="py-2.5 px-4 min-w-[200px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Employee
                </th>
                <th className="py-2.5 px-4 min-w-[180px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Email & Department
                </th>
                <th className="py-2.5 px-4 min-w-40 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Roles
                </th>
                <th className="py-2.5 px-4 min-w-34 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Employment
                </th>
                <th className="py-2.5 px-4 min-w-32 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Login Access
                </th>
                <th className="py-2.5 px-4 min-w-30 border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Hire Date
                </th>
                <th className="py-2.5 px-4 min-w-10 max-w-[50px] text-center font-bold text-foreground text-xs uppercase tracking-wider">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="hover:bg-muted/30">
                  <td className="py-3 px-4 min-w-[200px] border-e border-border">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-4 w-24 rounded" />
                      </div>
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </td>
                  <td className="py-3 px-4 min-w-[180px] border-e border-border">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </td>
                  <td className="py-3 px-4 min-w- 40 border-e border-border">
                    <div className="flex gap-1.5 flex-wrap">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </td>
                  <td className="py-3 px-4 w-[130px] min-w-[120px] border-e border-border">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </td>
                  <td className="py-3 px-4 w-[120px] min-w-[110px] border-e border-border">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="py-3 px-4 w-[110px] min-w-[100px] border-e border-border">
                    <Skeleton className="h-4 w-20 rounded" />
                  </td>
                  <td className="py-3 px-4 w-[45px] min-w-10 max-w-[50px]">
                    <div className="flex justify-center">
                      <Skeleton className="size-6 rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardTable>

      {/* Footer Skeleton */}
      <CardFooter className="py-3 px-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-28 rounded" />
          <div className="flex gap-1">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
