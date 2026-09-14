import { useEffect, useState } from 'react';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Power,
  UserCheck,
} from 'lucide-react';
import { EmploymentStatus, UpdateUserStatusDto, UserListItem } from '../types';
import { updateUserStatusSchema } from '../schemas';

interface Props {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isSelf?: boolean;
}

export function UserStatusDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  isSelf,
}: Props) {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [employmentStatus, setEmploymentStatus] =
    useState<EmploymentStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && open) {
      setIsActive(user.isActive);
      setEmploymentStatus(user.employmentStatus);
      setErrorMsg('');
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!user) return;
    if (isSelf) {
      toast.error('You cannot change your own account status.');
      return;
    }

    const parseResult = updateUserStatusSchema.safeParse({
      isActive,
      employmentStatus,
    });
    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0]?.message || 'Invalid status data');
      return;
    }

    const payload: UpdateUserStatusDto = {};
    let hasChanges = false;

    if (isActive !== user.isActive) {
      payload.isActive = isActive;
      hasChanges = true;
    }

    if (employmentStatus !== user.employmentStatus) {
      payload.employmentStatus = employmentStatus;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info('No status changes to update');
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.patch(`/users/${user.id}/status`, payload);
      toast.success(
        `Updated account status for ${user.username} successfully!`,
      );
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.message ||
          'An error occurred while updating account status.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const willRevokeSessions =
    (user.isActive && !isActive) ||
    (user.employmentStatus !== 'terminated' &&
      employmentStatus === 'terminated');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Power className="size-5 text-primary" />
            Update Account Status
          </DialogTitle>
          <DialogDescription>
            Adjust system login access and employment status for{' '}
            <strong className="text-foreground">{user.fullName}</strong> ({user.username}).
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          {/* Critical Session Invalidation Warning */}
          {willRevokeSessions ? (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
              <ShieldAlert className="size-5 shrink-0 mt-0.5 text-destructive" />
              <div className="flex flex-col gap-1 leading-relaxed">
                <strong className="text-sm font-semibold">
                  Warning: Immediate Session Invalidation!
                </strong>
                <p>
                  Disabling login access (locking account) or switching status to <strong>&quot;Terminated&quot;</strong> will <strong>immediately revoke all active sessions</strong> for this employee across all devices. The user will be logged out instantly.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
              <UserCheck className="size-4 text-emerald-500 shrink-0" />
              <span>
                Employees on leave (on_leave) can still log in if login access is enabled.
              </span>
            </div>
          )}

          {isSelf && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500 shrink-0" />
              <span>You cannot modify or lock your own account status.</span>
            </div>
          )}

          {/* Active Switch Control */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border">
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                System Login Access (`isActive`)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {isActive
                  ? 'Account is active and allowed to log into the system.'
                  : 'Account is locked / disabled; login is blocked.'}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting || isSelf}
            />
          </div>

          {/* Employment Status Select */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/20 border border-border">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Employment Status (`employmentStatus`)
            </Label>
            <Select
              value={employmentStatus}
              onValueChange={(val) => setEmploymentStatus(val as EmploymentStatus)}
              disabled={isSubmitting || isSelf}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Active</span>
                  </div>
                </SelectItem>
                <SelectItem value="on_leave">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>On Leave (can still log in)</span>
                  </div>
                </SelectItem>
                <SelectItem value="terminated">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-destructive" />
                    <span>Terminated (auto blocks login)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {errorMsg}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isSelf}
            variant={willRevokeSessions ? 'destructive' : 'primary'}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Confirm Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
