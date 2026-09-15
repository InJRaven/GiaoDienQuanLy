import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { formatRoleName } from '@/pages/users/types';

interface RolesCardProps {
  roles?: Array<{ id?: number; name?: string; description?: string } | string>;
}

export function RolesCard({ roles = [] }: RolesCardProps) {
  const roleNames: string[] = roles.map((r) => {
    if (typeof r === 'string') return r;
    return r.name || '';
  }).filter(Boolean);

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          Vai trò hệ thống
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {roleNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có vai trò nào được gán.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {roleNames.map((name, idx) => (
                <Badge
                  key={idx}
                  variant="primary"
                  appearance="light"
                  size="md"
                  className="font-medium cursor-default select-none"
                >
                  {formatRoleName(name)}
                </Badge>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground">
              Để thay đổi vai trò hoặc phân quyền, vui lòng truy cập trang Quản lý Vai trò & Quyền hạn.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
