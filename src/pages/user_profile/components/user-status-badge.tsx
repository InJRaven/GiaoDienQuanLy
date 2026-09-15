import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface UserStatusBadgeProps {
  isActive: boolean;
  employmentStatus?: string | null;
}

export function UserStatusBadge({
  isActive,
  employmentStatus,
}: UserStatusBadgeProps) {
  const status = (employmentStatus || '').trim().toLowerCase();

  if (status === 'terminated') {
    return (
      <Badge variant="destructive" appearance="light" className="gap-1.5 font-medium">
        <span className="size-2 rounded-full bg-destructive" />
        Đã nghỉ việc
      </Badge>
    );
  }

  if (!isActive) {
    return (
      <Badge variant="secondary" appearance="light" className="gap-1.5 font-medium">
        <span className="size-2 rounded-full bg-muted-foreground" />
        Ngưng hoạt động
      </Badge>
    );
  }

  if (status === 'active') {
    return (
      <Badge variant="success" appearance="light" className="gap-1.5 font-medium">
        <span className="size-2 rounded-full bg-emerald-500" />
        Đang làm việc
      </Badge>
    );
  }

  if (status === 'probation') {
    return (
      <Badge variant="warning" appearance="light" className="gap-1.5 font-medium">
        <span className="size-2 rounded-full bg-amber-500" />
        Thử việc
      </Badge>
    );
  }

  if (status === 'leave' || status === 'on_leave') {
    return (
      <Badge variant="primary" appearance="light" className="gap-1.5 font-medium">
        <span className="size-2 rounded-full bg-blue-500" />
        Nghỉ phép
      </Badge>
    );
  }

  // Fallback: render raw unknown status verbatim
  return (
    <Badge variant="outline" className="gap-1.5 font-medium">
      <span className="size-2 rounded-full bg-primary" />
      {employmentStatus || 'Không xác định'}
    </Badge>
  );
}

interface EmailVerifiedBadgeProps {
  verified?: boolean;
  onVerifyClick?: () => void;
  canVerify?: boolean;
}

export function EmailVerifiedBadge({
  verified,
  onVerifyClick,
  canVerify = true,
}: EmailVerifiedBadgeProps) {
  if (verified) {
    return (
      <Badge variant="success" appearance="light" className="gap-1 font-medium">
        <CheckCircle2 className="size-3.5 text-emerald-600" />
        Email đã xác thực
      </Badge>
    );
  }

  return (
    <button
      type="button"
      onClick={canVerify ? onVerifyClick : undefined}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
        canVerify
          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100 cursor-pointer shadow-xs active:scale-95'
          : 'bg-muted text-muted-foreground border-border cursor-default'
      }`}
      title={canVerify ? 'Nhấn để bắt đầu xác thực email' : undefined}
    >
      <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
      <span>Chưa xác thực</span>
      {canVerify && (
        <span className="underline text-[11px] ml-0.5 opacity-90">Xác thực ngay</span>
      )}
    </button>
  );
}
