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
import {
  ShieldAlert,
  Loader2,
  Users,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  formatRoleName,
  PermissionItem,
  PERMISSION_METADATA,
  RoleItem,
} from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleItem | null;
  addedPermissions: PermissionItem[];
  removedPermissions: PermissionItem[];
  newSelectedCount: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function RolePermissionsConfirmDialog({
  open,
  onOpenChange,
  role,
  addedPermissions,
  removedPermissions,
  newSelectedCount,
  onConfirm,
  isSubmitting,
}: Props) {
  if (!role) return null;

  const totalChanges = addedPermissions.length + removedPermissions.length;
  const isRemovingAll = newSelectedCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldAlert className="size-5 text-primary" />
            Confirm Permission Changes
          </DialogTitle>
          <DialogDescription>
            Review modified permissions for role{' '}
            <strong className="text-foreground font-semibold">
              {formatRoleName(role.name)}
            </strong>{' '}
            (<span className="font-mono text-xs">@{role.name}</span>).
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2 text-xs">
          {/* Affected Users & Immediate Effect Alert */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Users className="size-4 text-primary" />
                <span>Affected Employees:</span>
              </div>
              <span className="font-mono font-bold text-sm text-foreground">
                {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
              </span>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-muted-foreground border-t border-border/50 pt-2 leading-relaxed">
              <Zap className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Immediate effect:</strong> The server will immediately invalidate cached permissions for all users holding this role. Changes will apply on their next API request without requiring re-login.
              </span>
            </div>
          </div>

          {/* Removing All Permissions Warning */}
          {isRemovingAll && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5">
              <AlertTriangle className="size-5 shrink-0 mt-0.5 text-destructive" />
              <div className="leading-relaxed text-xs">
                <strong className="font-semibold block mb-0.5">
                  Caution: Removing All Permissions!
                </strong>
                You are about to uncheck all permissions for this role. Any user with this role will lose access to all modules.
              </div>
            </div>
          )}

          {/* Diff Summary Count */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Changes summary:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <PlusCircle className="size-3.5" /> +{addedPermissions.length} added
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <MinusCircle className="size-3.5" /> -{removedPermissions.length} removed
            </span>
          </div>

          {/* Added Permissions List */}
          {addedPermissions.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <PlusCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Permissions to Grant ({addedPermissions.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {addedPermissions.map((perm) => (
                  <span
                    key={perm.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    title={PERMISSION_METADATA[perm.code]?.description}
                  >
                    +{perm.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Removed Permissions List */}
          {removedPermissions.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col gap-2">
              <span className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <MinusCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
                Permissions to Revoke ({removedPermissions.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {removedPermissions.map((perm) => (
                  <span
                    key={perm.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                    title={PERMISSION_METADATA[perm.code]?.description}
                  >
                    -{perm.code}
                  </span>
                ))}
              </div>
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
            onClick={onConfirm}
            disabled={isSubmitting || totalChanges === 0}
            variant={isRemovingAll ? 'destructive' : 'primary'}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Confirm & Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
