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
  if (!dateStr) return 'Not set';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Never logged in';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
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
  if (!user) return null;

  const roles = user.roles || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base uppercase shrink-0">
              {user.fullName.charAt(0) || user.username.charAt(0)}
            </div>
            <div className="flex flex-col text-start">
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                {user.fullName}
                {isSelf && (
                  <Badge variant="secondary" size="xs">
                    You
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted-foreground">
                @{user.username} {user.employeeCode ? `• ${user.employeeCode}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2 text-xs">
          {/* Status Overview Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Employment Status
              </span>
              <div>
                {user.employmentStatus === 'active' && (
                  <Badge variant="success" appearance="light" size="sm">
                    Active
                  </Badge>
                )}
                {user.employmentStatus === 'on_leave' && (
                  <Badge variant="warning" appearance="light" size="sm">
                    On Leave
                  </Badge>
                )}
                {user.employmentStatus === 'terminated' && (
                  <Badge variant="destructive" appearance="light" size="sm">
                    Terminated
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Login Access
              </span>
              <div>
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                    <span className="size-1.5 rounded-full bg-destructive" />
                    Disabled / Locked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="flex flex-col divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5" /> Email
              </span>
              <span className="font-medium text-foreground">
                {user.email || <span className="text-muted-foreground/60 italic">None</span>}
              </span>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-3.5" /> Department
              </span>
              <span className="font-medium text-foreground">
                {user.department || <span className="text-muted-foreground/60 italic">Unassigned</span>}
              </span>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-3.5" /> Hire Date
              </span>
              <span className="font-mono text-foreground">
                {formatDate(user.hireDate)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5" /> Last Login
              </span>
              <span className="font-mono text-foreground">
                {formatDateTime(user.lastLoginAt)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="size-3.5" /> Created At
              </span>
              <span className="font-mono text-foreground">
                {formatDateTime(user.createdAt)}
              </span>
            </div>
          </div>

          {/* Assigned Roles */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                System Roles ({roles.length})
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
                  Manage Roles
                </button>
              )}
            </div>

            {roles.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-2 text-xs">
                <ShieldAlert className="size-4 text-amber-500 shrink-0" />
                <span>
                  No roles assigned to this account. The user will see an empty menu upon login.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {roles.map((r) => (
                  <Badge key={r.id} variant="secondary" size="sm" className="gap-1">
                    {formatRoleName(r.name)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="flex flex-wrap gap-2 justify-between sm:justify-between">
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
                <Edit3 className="size-3.5" /> Edit Profile
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
                <Power className="size-3.5" /> Status
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
                <KeyRound className="size-3.5" /> Reset Password
              </Button>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
