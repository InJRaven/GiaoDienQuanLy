import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  Users,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { formatRoleName, RoleDetail } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDetail | null;
  onSuccess: () => void;
}

export function RoleDeleteDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: Props) {
  const navigate = useNavigate();
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmName('');
      setErrorMsg('');
    }
    onOpenChange(newOpen);
  };

  if (!role) return null;

  const isSystemRole = role.isSystem;
  const hasUsers = role.userCount > 0;
  const isConfirmed = confirmName.trim() === role.name;

  const handleDelete = async () => {
    if (isSystemRole || hasUsers || !isConfirmed) return;

    setIsDeleting(true);
    setErrorMsg('');

    try {
      await api.delete(`/roles/${role.id}`);
      toast.success(`Role "${role.name}" deleted successfully!`);
      onSuccess();
      handleClose(false);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      if (serverCode === 'ROLE_HAS_USERS') {
        setErrorMsg('Cannot delete role while employees are still assigned to it.');
      } else if (serverCode === 'ROLE_IS_SYSTEM') {
        setErrorMsg('System roles cannot be deleted.');
      } else {
        setErrorMsg(
          e?.response?.data?.message ||
            'An error occurred while deleting the role.',
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNavigateToUsers = () => {
    handleClose(false);
    navigate(`/users/list?roleId=${role.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            Permanent deletion for role{' '}
            <strong className="text-foreground">{formatRoleName(role.name)}</strong>{' '}
            (<span className="font-mono text-xs">@{role.name}</span>).
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2 text-xs">
          {isSystemRole ? (
            /* Case 1: System role cannot be deleted */
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-start gap-3">
              <ShieldCheck className="size-5 shrink-0 mt-0.5 text-primary" />
              <div className="leading-relaxed">
                <strong className="text-sm font-semibold block mb-1">
                  System Role Protected
                </strong>
                This is a core system role required for fundamental operations and disaster recovery. It cannot be deleted.
              </div>
            </div>
          ) : hasUsers ? (
            /* Case 2: Role has active users assigned */
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-200 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-sm">
                <AlertTriangle className="size-5 shrink-0 text-amber-600" />
                Cannot Delete: Active Users Assigned
              </div>
              <p className="leading-relaxed">
                There are currently{' '}
                <strong className="font-bold">{role.userCount} active employee(s)</strong>{' '}
                holding this role. The system intentionally prevents deleting roles with active users to prevent accidental bulk permission loss.
              </p>
              <div className="p-3 rounded-lg bg-background/80 border border-border flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    Required action:
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Reassign or remove this role from all {role.userCount} employees first.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleNavigateToUsers}
                  className="gap-1.5 h-8 text-xs shrink-0"
                >
                  <Users className="size-3.5" />
                  View {role.userCount} Employee(s)
                  <ExternalLink className="size-3" />
                </Button>
              </div>
            </div>
          ) : (
            /* Case 3: Role has 0 users, safe to delete with confirmation */
            <>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                This action is permanent and cannot be undone. All configured permission mappings for this role will be destroyed.
              </div>

              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
                <span className="text-destructive font-semibold">
                  To confirm deletion, please type the role key:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-background px-2 py-1 rounded border select-all text-foreground">
                    {role.name}
                  </span>
                </div>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={`Type "${role.name}" to confirm`}
                  className="font-mono text-xs h-9 bg-background"
                  disabled={isDeleting}
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isDeleting}
          >
            {isSystemRole || hasUsers ? 'Close' : 'Cancel'}
          </Button>
          {!isSystemRole && !hasUsers && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || !isConfirmed}
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
