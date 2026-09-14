import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerOrderTableSkeleton() {
  return (
    <Card className="border border-border shadow-xs">
      {/* Header Skeleton */}
      <CardHeader className="py-4 px-6 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 grow">
          <Skeleton className="h-8 w-full sm:w-72 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <CardToolbar className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardToolbar>
      </CardHeader>

      {/* Table Skeleton */}
      <CardTable>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                <th className="py-3 px-3 w-12 text-center border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  #
                </th>
                <th className="py-3 px-4 min-w-[150px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="py-3 px-3 min-w-[90px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Mã môn
                </th>
                <th className="py-3 px-4 min-w-[180px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Tài khoản Coursera
                </th>
                <th className="py-3 px-3 min-w-[140px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Mật khẩu
                </th>
                <th className="py-3 px-4 min-w-[120px] text-right border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Giá
                </th>
                <th className="py-3 px-3 min-w-[130px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Phụ trách
                </th>
                <th className="py-3 px-3 w-24 text-center border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Học xong
                </th>
                <th className="py-3 px-3 w-24 text-center border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Chứng chỉ
                </th>
                <th className="py-3 px-3 w-28 text-center border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="py-3 px-3 min-w-[130px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="py-3 px-3 min-w-[110px] border-e border-border font-bold text-foreground text-xs uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="py-3 px-3 w-14 text-center font-bold text-foreground text-xs uppercase tracking-wider">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, index) => (
                <tr key={index} className="hover:bg-muted/30">
                  <td className="py-3.5 px-3 text-center border-e border-border">
                    <Skeleton className="h-4 w-5 mx-auto rounded" />
                  </td>
                  <td className="py-3.5 px-4 border-e border-border">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 border-e border-border">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4 border-e border-border">
                    <Skeleton className="h-4 w-36 rounded" />
                  </td>
                  <td className="py-3.5 px-3 border-e border-border">
                    <Skeleton className="h-4 w-20 rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right border-e border-border">
                    <Skeleton className="h-4 w-20 ml-auto rounded" />
                  </td>
                  <td className="py-3.5 px-3 border-e border-border">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center border-e border-border">
                    <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                  </td>
                  <td className="py-3.5 px-3 text-center border-e border-border">
                    <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                  </td>
                  <td className="py-3.5 px-3 text-center border-e border-border">
                    <Skeleton className="h-5 w-18 mx-auto rounded-full" />
                  </td>
                  <td className="py-3.5 px-3 border-e border-border">
                    <Skeleton className="h-4 w-24 rounded" />
                  </td>
                  <td className="py-3.5 px-3 border-e border-border">
                    <Skeleton className="h-3.5 w-18 rounded" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Skeleton className="size-7 mx-auto rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardTable>

      {/* Footer Skeleton */}
      <CardFooter className="py-3.5 px-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-4 w-44 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-8 w-36 rounded" />
        </div>
      </CardFooter>
    </Card>
  );
}
