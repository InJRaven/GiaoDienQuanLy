import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PositionOption } from '@/pages/users/types';
import { Briefcase } from 'lucide-react';
import { UserProfileResponse } from '../types';
import { formatDateOnly, formatVndString } from '../utils';
import { UserStatusBadge } from './user-status-badge';

interface WorkInfoCardProps {
  user: UserProfileResponse;
  position?: PositionOption | null;
}

export function WorkInfoCard({ user, position }: WorkInfoCardProps) {
  const formattedSalary = position?.defaultSalary
    ? formatVndString(position.defaultSalary)
    : null;

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Briefcase className="size-4 text-primary" />
          Công việc & Nhân sự
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-4 text-sm">
          {/* Employee Code */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
            <span className="text-muted-foreground font-medium">Mã nhân viên</span>
            <span className="text-foreground font-mono font-medium">
              {user.employeeCode || '—'}
            </span>
          </div>

          {/* Department */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
            <span className="text-muted-foreground font-medium">Phòng ban</span>
            <span className="text-foreground font-medium">
              {user.department || '—'}
            </span>
          </div>

          {/* Position */}
          {position?.name && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Chức vụ</span>
              <span className="text-foreground font-medium">
                {position.name}
              </span>
            </div>
          )}

          {/* Hire Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
            <span className="text-muted-foreground font-medium">Ngày vào làm</span>
            <span className="text-foreground font-medium">
              {formatDateOnly(user.hireDate)}
            </span>
          </div>

          {/* Employment Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
            <span className="text-muted-foreground font-medium">Trạng thái lao động</span>
            <div>
              <UserStatusBadge
                isActive={user.isActive}
                employmentStatus={user.employmentStatus}
              />
            </div>
          </div>

          {/* Reference Salary (Formatted from String) */}
          {formattedSalary && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5">
              <div>
                <span className="text-muted-foreground font-medium block">
                  Mức lương tham khảo
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  (Theo gợi ý của chức vụ, không phải lương thực tế)
                </span>
              </div>
              <span className="text-foreground font-semibold text-sm">
                {formattedSalary}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
