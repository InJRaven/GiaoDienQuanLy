import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardToolbar,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MenuTreeSkeleton() {
  return (
    <Card className="border border-border h-full flex flex-col shadow-xs">
      {/* Header Skeleton */}
      <CardHeader className="py-3 px-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <CardHeading className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4.5 rounded" />
            <Skeleton className="h-4.5 w-32 rounded" />
          </div>
          <Skeleton className="h-3 w-48 rounded" />
        </CardHeading>
        <CardToolbar className="flex items-center gap-1.5 shrink-0">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </CardToolbar>
      </CardHeader>

      {/* Tree Content Skeleton */}
      <CardContent className="p-3 grow flex flex-col gap-1.5 overflow-hidden">
        {/* Root level item 1 with children */}
        <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg border border-border/60 bg-muted/20">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="size-3 rounded shrink-0" />
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3.5 w-12 rounded-full ml-auto" />
        </div>
        {/* Child level 1 item */}
        <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg border border-border/40 bg-card ml-6">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        {/* Child level 2 item */}
        <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg border border-border/40 bg-card ml-6">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Root level item 2 */}
        <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg border border-border/60 bg-muted/20 mt-1">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="size-3 rounded shrink-0" />
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3.5 w-14 rounded-full ml-auto" />
        </div>
        {/* Child item */}
        <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg border border-border/40 bg-card ml-6">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>

        {/* Root level item 3 */}
        <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg border border-border/60 bg-muted/20 mt-1">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-30 rounded" />
        </div>

        {/* Root level item 4 */}
        <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg border border-border/60 bg-muted/20 mt-1">
          <Skeleton className="size-3.5 rounded shrink-0" />
          <Skeleton className="size-4 rounded shrink-0" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
