import { useState } from 'react';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Trash2,
  AlertTriangle,
  Loader2,
  PowerOff,
  AlertCircle,
} from 'lucide-react';
import { UserListItem } from '../types';

interface Props {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isSelf?: boolean;
}

export function UserDeleteDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  isSelf,
}: Props) {
  const [confirmUsername, setConfirmUsername] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [hasDataError, setHasDataError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState('');

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmUsername('');
      setHasDataError(null);
      setGeneralError('');
    }
    onOpenChange(newOpen);
  };

  const handleDelete = async () => {
    if (!user) return;
    if (isSelf) {
      toast.error('You cannot delete your own account.');
      return;
    }

    if (confirmUsername.trim() !== user.username) {
      toast.error('Confirmation username does not match');
      return;
    }

    setIsDeleting(true);
    setHasDataError(null);
    setGeneralError('');

    try {
      await api.delete(`/users/${user.id}`);
      toast.success(`Account ${user.username} deleted permanently!`);
      onSuccess();
      handleClose(false);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      const msg =
        e?.response?.data?.message ||
        'Account has related operational records and cannot be deleted.';

      if (serverCode === 'USER_HAS_DATA' || e?.response?.status === 422) {
        setHasDataError(msg);
      } else {
        setGeneralError(msg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Immediate fallback deactivation action when USER_HAS_DATA occurs
  const handleDeactivateInstead = async () => {
    if (!user) return;
    setIsDeactivating(true);

    try {
      await api.patch(`/users/${user.id}/status`, { isActive: false });
      toast.success(
        `Account ${user.username} deactivated successfully. All active sessions have been revoked.`,
      );
      onSuccess();
      handleClose(false);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || 'Failed to deactivate account.',
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  if (!user) return null;

  const isConfirmed = confirmUsername.trim() === user.username;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Delete Employee Account
          </DialogTitle>
          <DialogDescription>
            Permanent account deletion for{' '}
            <strong className="text-foreground">{user.fullName}</strong> ({user.username}).
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          {hasDataError ? (
            /* 422 USER_HAS_DATA Resolution Panel */
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-sm">
                <AlertTriangle className="size-5 shrink-0 text-amber-600" />
                Cannot Delete: Associated Operational Records Exist
              </div>
              <p className="leading-relaxed">
                {hasDataError}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This employee has existing operational records in the system (timecards, orders, approvals, or data created). Permanently deleting this account would compromise data integrity and audit trails.
              </p>
              <div className="p-3 rounded-lg bg-background/80 border border-border flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    Recommended Solution:
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Disable login access to block access while preserving historical data.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeactivateInstead}
                  disabled={isDeactivating}
                  className="gap-1.5 h-8 text-xs shrink-0"
                >
                  {isDeactivating && <Loader2 className="size-3.5 animate-spin" />}
                  <PowerOff className="size-3.5" />
                  Deactivate Account Now
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Deactivation recommendation advice */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex flex-col gap-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <AlertCircle className="size-4 text-amber-500 shrink-0" />
                  Administrative Guidance:
                </div>
                <p className="leading-relaxed">
                  The system only allows deleting accounts that have <strong>never produced any operational data</strong> (test or mistyped accounts). If the employee has activity history, please use <strong>Deactivate Account</strong> to preserve audit integrity.
                </p>
              </div>

              {/* Confirmation Input */}
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
                <span className="text-destructive font-semibold">
                  To confirm permanent deletion, please enter the exact username:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-background px-2 py-1 rounded border select-all text-foreground">
                    {user.username}
                  </span>
                </div>
                <Input
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  placeholder={`Type "${user.username}" to confirm`}
                  className="font-mono text-xs h-9 bg-background"
                  disabled={isDeleting}
                  autoFocus
                />
              </div>

              {generalError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  {generalError}
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isDeleting || isDeactivating}
          >
            {hasDataError ? 'Close' : 'Cancel'}
          </Button>
          {!hasDataError && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || !isConfirmed || isSelf}
              className="gap-1.5"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete Permanently
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
