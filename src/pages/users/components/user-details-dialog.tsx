import { useEffect, useState } from 'react';
import { api } from '@/lib/axios.config';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Power,
  Edit3,
  KeyRound,
  ShieldAlert,
  Phone,
  CreditCard,
  MapPin,
  Landmark,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { formatRoleName, UserListItem } from '../types';

interface Props {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  onAssignRoles?: () => void;
  onResetPassword?: () => void;
  canUpdate?: boolean;
  canAssignRoles?: boolean;
  canCreate?: boolean;
  isSelf?: boolean;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa từng đăng nhập';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatSalaryVND(salaryStr?: string | null): string {
  if (!salaryStr) return '';
  const num = Number(salaryStr);
  if (isNaN(num)) return salaryStr;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
  onAssignRoles,
  onResetPassword,
  canUpdate,
  canAssignRoles,
  canCreate,
  isSelf,
}: Props) {
  const [detailedUser, setDetailedUser] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (user && open) {
      setIsLoadingDetail(true);
      api
        .get(`/users/${user.id}`)
        .then((res) => {
          setDetailedUser(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch user details:', err);
          setDetailedUser(null);
        })
        .finally(() => {
          setIsLoadingDetail(false);
        });
    } else {
      setDetailedUser(null);
    }
  }, [user, open]);

  if (!user) return null;

  const roles = user.roles || [];
  const activeUser = detailedUser || user;
  const hasProfilePermission = detailedUser && 'profile' in detailedUser;
  const profile = detailedUser?.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={activeUser.fullName}
                className="size-11 rounded-full object-cover border border-border shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base uppercase shrink-0">
                {activeUser.fullName.charAt(0) || activeUser.username.charAt(0)}
              </div>
            )}
            <div className="flex flex-col text-start">
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                {activeUser.fullName}
                {isSelf && (
                  <Badge variant="secondary" size="xs">
                    Bạn
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted-foreground">
                @{activeUser.username}{' '}
                {activeUser.employeeCode ? `• ${activeUser.employeeCode}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 px-6 py-2 overflow-y-auto text-xs">
          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Đang tải hồ sơ nhân viên...</p>
            </div>
          ) : (
            <>
              {/* Status Overview Card */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Trạng thái việc làm
                  </span>
                  <div>
                    {activeUser.employmentStatus === 'active' && (
                      <Badge variant="success" appearance="light" size="sm">
                        Đang làm việc
                      </Badge>
                    )}
                    {activeUser.employmentStatus === 'on_leave' && (
                      <Badge variant="warning" appearance="light" size="sm">
                        Nghỉ phép
                      </Badge>
                    )}
                    {activeUser.employmentStatus === 'terminated' && (
                      <Badge variant="destructive" appearance="light" size="sm">
                        Đã thôi việc
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Quyền đăng nhập
                  </span>
                  <div>
                    {activeUser.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                        <span className="size-1.5 rounded-full bg-destructive" />
                        Đã khoá / Vô hiệu
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Thông tin công việc */}
              <div className="flex flex-col divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5" /> Email
                  </span>
                  <span className="font-medium text-foreground">
                    {activeUser.email || (
                      <span className="text-muted-foreground/60 italic">Chưa có</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-3.5" /> Phòng ban
                  </span>
                  <span className="font-medium text-foreground">
                    {activeUser.department || (
                      <span className="text-muted-foreground/60 italic">Chưa phân</span>
                    )}
                  </span>
                </div>

                {/* Position / Chức vụ */}
                <div className="flex items-center justify-between p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="size-3.5" /> Chức vụ
                  </span>
                  <span className="font-medium text-foreground">
                    {detailedUser?.position?.name ||
                      activeUser.position?.name || (
                        <span className="text-muted-foreground/60 italic">Chưa phân</span>
                      )}
                    {(detailedUser?.position?.defaultSalary ||
                      activeUser.position?.defaultSalary) && (
                      <span className="ml-2 text-[11px] text-muted-foreground font-mono">
                        (
                        {formatSalaryVND(
                          detailedUser?.position?.defaultSalary ||
                            activeUser.position?.defaultSalary,
                        )}
                        )
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3.5" /> Ngày vào làm
                  </span>
                  <span className="font-mono text-foreground">
                    {formatDate(activeUser.hireDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3.5" /> Đăng nhập gần nhất
                  </span>
                  <span className="font-mono text-foreground">
                    {formatDateTime(activeUser.lastLoginAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5" /> Ngày tạo
                  </span>
                  <span className="font-mono text-foreground">
                    {formatDateTime(activeUser.createdAt)}
                  </span>
                </div>
              </div>

              {/* Thông tin cá nhân & Ngân hàng - Conditionally rendered only if 'profile' in detailedUser */}
              {hasProfilePermission && (
                <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-card border border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <CreditCard className="size-4 text-primary" />
                    Hồ sơ cá nhân & Ngân hàng
                  </span>

                  <div className="flex flex-col divide-y divide-border border border-border rounded-lg bg-muted/10 overflow-hidden mt-1">
                    <div className="flex items-center justify-between p-2.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-3.5" /> Số điện thoại
                      </span>
                      <span className="font-mono text-foreground">
                        {profile?.phone || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="size-3.5" /> CCCD / CMND
                      </span>
                      <span className="font-mono text-foreground">
                        {profile?.idCardNumber || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-3.5" /> Ngày sinh
                      </span>
                      <span className="font-mono text-foreground">
                        {formatDate(profile?.dateOfBirth)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-3.5" /> Địa chỉ
                      </span>
                      <span className="text-foreground text-right max-w-xs truncate">
                        {profile?.address || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Landmark className="size-3.5" /> Số tài khoản ngân hàng
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {profile?.bankAccount || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="size-3.5" /> Ngân hàng
                      </span>
                      <span className="text-foreground font-medium">
                        {profile?.bankName || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned Roles */}
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" />
                    Vai trò hệ thống ({roles.length})
                  </span>
                  {canAssignRoles && onAssignRoles && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onAssignRoles();
                      }}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Phân vai trò
                    </button>
                  )}
                </div>

                {roles.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-2 text-xs">
                    <ShieldAlert className="size-4 text-amber-500 shrink-0" />
                    <span>
                      Tài khoản chưa được gán vai trò nào. Người dùng sẽ thấy menu trống khi đăng nhập.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {roles.map((r) => (
                      <Badge
                        key={r.id}
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                      >
                        {formatRoleName(r.name)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter className="p-6 pt-3 flex flex-wrap gap-2 justify-between sm:justify-between border-t border-border">
          <div className="flex gap-2">
            {canUpdate && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit();
                }}
                className="gap-1.5 text-xs h-8"
              >
                <Edit3 className="size-3.5" /> Sửa thông tin
              </Button>
            )}
            {canUpdate && onToggleStatus && !isSelf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onToggleStatus();
                }}
                className="gap-1.5 text-xs h-8"
              >
                <Power className="size-3.5" /> Trạng thái
              </Button>
            )}
            {canCreate && onResetPassword && !isSelf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onResetPassword();
                }}
                className="gap-1.5 text-xs h-8"
              >
                <KeyRound className="size-3.5" /> Đổi mật khẩu
              </Button>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
