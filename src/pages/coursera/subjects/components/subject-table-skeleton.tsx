import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SubjectTableSkeleton() {
  return (
    <Card className="border border-border shadow-xs">
      {/* Header Skeleton */}
      <CardHeader className="py-4 px-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton className="h-8 w-full sm:w-72 rounded-md" />
        <CardToolbar className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </CardToolbar>
      </CardHeader>

      {/* Table Skeleton */}
      <CardTable>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Head */}
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="py-2.5 px-4 w-[90px] min-w-[85px] max-w-[110px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Code
                </th>
                <th className="py-2.5 px-4 min-w-[350px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Links
                </th>
                <th className="py-2.5 px-4 w-[85px] min-w-20 max-w-[95px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2.5 px-4 w-[105px] min-w-[95px] max-w-[115px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Created At
                </th>
                <th className="py-2.5 px-4 w-[45px] min-w-10 max-w-[50px] text-center font-bold text-foreground text-xs uppercase tracking-wider">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="hover:bg-muted/30">
                  <td className="py-3 px-4 w-[90px] min-w-[85px] max-w-[110px] border-e border-border">
                    <Skeleton className="h-4 w-16 rounded" />
                  </td>
                  <td className="py-3 px-4 min-w-[350px] border-e border-border">
                    <div className="flex items-center justify-between p-1.5 px-2.5 rounded-md bg-muted/30 border border-border/40 w-full max-w-md">
                      <Skeleton className="h-3.5 w-4/5 rounded" />
                      <div className="flex gap-1.5 shrink-0">
                        <Skeleton className="size-4 rounded" />
                        <Skeleton className="size-4 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 w-[85px] min-w-20 max-w-[95px] border-e border-border">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="py-3 px-4 w-[105px] min-w-[95px] max-w-[115px] border-e border-border">
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
