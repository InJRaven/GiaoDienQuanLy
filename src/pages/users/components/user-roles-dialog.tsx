import { useEffect, useState } from 'react';
import { api } from '@/lib/axios.config';
import { useApiQuery } from '@/hooks/use-api-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { formatRoleName, UserListItem, UserRole } from '../types';

interface Props {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserRolesDialog({ user, open, onOpenChange, onSuccess }: Props) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch available roles
  const { data: roles = [], isLoading: isLoadingRoles } = useApiQuery<UserRole[]>(
    ['users', 'roles'],
    '/users/roles',
    {
      enabled: open,
      staleTime: 5 * 60 * 1000,
    },
  );

  useEffect(() => {
    if (user && open) {
      const initialIds = (user.roles || []).map((r) => r.id);
      setSelectedRoleIds(initialIds);
      setErrorMsg('');
    }
  }, [user, open]);

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setErrorMsg('');

    const initialRoleIds = (user.roles || []).map((r) => r.id);

    // Calculate diff
    const addedRoleIds = selectedRoleIds.filter((id) => !initialRoleIds.includes(id));
    const removedRoleIds = initialRoleIds.filter((id) => !selectedRoleIds.includes(id));

    if (addedRoleIds.length === 0 && removedRoleIds.length === 0) {
      toast.info('No role changes detected');
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute additions sequentially or via Promise.all
      for (const roleId of addedRoleIds) {
        await api.post(`/users/${user.id}/roles`, { roleId });
      }

      // Execute deletions sequentially or via Promise.all
      for (const roleId of removedRoleIds) {
        await api.delete(`/users/${user.id}/roles/${roleId}`);
      }

      toast.success(`Roles updated for ${user.fullName} successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.message || 'An error occurred while updating roles.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Assign Roles & Permissions
          </DialogTitle>
          <DialogDescription>
            Configure system roles for{' '}
            <strong className="text-foreground">{user.fullName}</strong> ({user.username}).
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          {/* Real-time effect banner */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs flex items-start gap-2.5">
            <Sparkles className="size-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Permissions take effect on the employee&apos;s very next request via Redis Cache. No user logout required.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Roles List
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Selected {selectedRoleIds.length} roles
              </span>
            </div>

            {isLoadingRoles ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading roles list...
              </div>
            ) : roles.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/30 text-center text-xs text-muted-foreground italic">
                No roles defined in the system.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {roles.map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id);
                  return (
                    <div
                      key={role.id}
                      onClick={() => toggleRole(role.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40 shadow-xs'
                          : 'bg-background hover:bg-muted/40 border-border'
                      }`}
                    >
                      <div
                        className={`size-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-input bg-background'
                        }`}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs text-foreground">
                          {formatRoleName(role.name)}
                        </span>
                        {role.description && (
                          <span className="text-[11px] text-muted-foreground leading-relaxed">
                            {role.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRoleIds.length === 0 && (
            <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500 shrink-0" />
              <span>
                Warning: If all roles are removed, this user will see an empty menu upon login.
              </span>
            </div>
          )}

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
          <Button onClick={handleSave} disabled={isSubmitting} className="gap-1.5">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save Role Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
