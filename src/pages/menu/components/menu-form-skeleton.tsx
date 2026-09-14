import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeading,
  CardToolbar,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MenuFormSkeleton() {
  return (
    <Card className="border border-border h-full flex flex-col shadow-xs">
      {/* Form Header */}
      <CardHeader className="py-3 px-5 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <CardHeading className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-4.5 w-14 rounded-full" />
            <Skeleton className="h-4.5 w-18 rounded-full" />
          </div>
          <Skeleton className="h-3 w-56 rounded" />
        </CardHeading>
        <CardToolbar className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardToolbar>
      </CardHeader>

      {/* Form Content */}
      <CardContent className="p-5 space-y-4 grow overflow-y-auto">
        {/* Row 1: Key & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>

        {/* Row 2: Title EN & Title VI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>

        {/* Row 3: Path & Icon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* Row 4: Parent Item & Required Permission */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>

        {/* Row 5: Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        </div>
      </CardContent>

      {/* Form Footer */}
      <CardFooter className="py-3 px-5 border-t border-border flex justify-end gap-2 shrink-0 bg-muted/10">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </CardFooter>
    </Card>
  );
}
