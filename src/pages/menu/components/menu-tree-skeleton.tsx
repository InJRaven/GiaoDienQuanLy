import { Skeleton } from '@/components/ui/skeleton';

export function MenuTreeSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-5/6 ml-4" />
      <Skeleton className="h-8 w-5/6 ml-4" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-5/6 ml-4" />
    </div>
  );
}
