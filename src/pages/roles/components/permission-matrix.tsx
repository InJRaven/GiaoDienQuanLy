import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  ShieldCheck,
  Edit3,
  Trash2,
  Lock,
  Search,
  Users,
  RotateCcw,
  Save,
  CheckCircle2,
  X,
  Flame,
} from 'lucide-react';
import {
  formatRoleName,
  MODULE_NAMES,
  PermissionItem,
  PERMISSION_METADATA,
  RoleDetail,
  SENSITIVE_PERMISSIONS,
} from '../types';
import { RolePermissionsConfirmDialog } from './role-permissions-confirm-dialog';

interface Props {
  roleDetail: RoleDetail | null;
  allPermissions: PermissionItem[];
  currentUserRoles: string[];
  canManage: boolean;
  isLoading?: boolean;
  onEditRole: () => void;
  onDeleteRole: () => void;
  onSavePermissions: (permissionIds: number[]) => Promise<void>;
  isSaving: boolean;
}

export function PermissionMatrix({
  roleDetail,
  allPermissions,
  currentUserRoles,
  canManage,
  isLoading,
  onEditRole,
  onDeleteRole,
  onSavePermissions,
  isSaving,
}: Props) {
  // Pending permission IDs (local state until saved)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastRoleId, setLastRoleId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Sync initial permissions whenever selected role changes
  if (roleDetail && roleDetail.id !== lastRoleId) {
    setLastRoleId(roleDetail.id);
    const initialIds = (roleDetail.permissions || []).map((p) => p.id);
    setSelectedIds(initialIds);
  }

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    for (const perm of allPermissions) {
      if (!groups[perm.module]) {
        groups[perm.module] = [];
      }
      groups[perm.module].push(perm);
    }
    return groups;
  }, [allPermissions]);

  // Compute Diff: added and removed
  const originalIds = useMemo(() => {
    return new Set((roleDetail?.permissions || []).map((p) => p.id));
  }, [roleDetail]);

  const addedPermissions = useMemo(() => {
    return allPermissions.filter(
      (p) => selectedIds.includes(p.id) && !originalIds.has(p.id),
    );
  }, [allPermissions, selectedIds, originalIds]);

  const removedPermissions = useMemo(() => {
    return allPermissions.filter(
      (p) => !selectedIds.includes(p.id) && originalIds.has(p.id),
    );
  }, [allPermissions, selectedIds, originalIds]);

  const hasChanges = addedPermissions.length > 0 || removedPermissions.length > 0;

  // Check if current user holds this role (used for self-lockout prevention)
  const isCurrentUserRole = Boolean(
    roleDetail && currentUserRoles.includes(roleDetail.name),
  );

  // Reset local state to current saved role permissions
  const handleReset = () => {
    if (!roleDetail) return;
    setSelectedIds((roleDetail.permissions || []).map((p) => p.id));
  };

  // Toggle single permission
  const handleToggle = (perm: PermissionItem) => {
    if (!roleDetail || roleDetail.isSystem || !canManage) return;

    // Self-lockout prevention: cannot uncheck 'roles:manage' if user holds this role
    if (isCurrentUserRole && perm.code === 'roles:manage') {
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(perm.id)
        ? prev.filter((id) => id !== perm.id)
        : [...prev, perm.id],
    );
  };

  // Module level toggle: Select All / Deselect All within a single module
  const handleToggleModule = (moduleKey: string, modulePerms: PermissionItem[]) => {
    if (!roleDetail || roleDetail.isSystem || !canManage) return;

    const modulePermIds = modulePerms.map((p) => p.id);
    const isAllSelected = modulePermIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      // Deselect all in module, EXCEPT if self-lockout protected
      setSelectedIds((prev) =>
        prev.filter((id) => {
          if (!modulePermIds.includes(id)) return true;
          // Protect roles:manage if self-lockout rule applies
          if (isCurrentUserRole && moduleKey === 'roles') {
            const perm = modulePerms.find((p) => p.id === id);
            if (perm?.code === 'roles:manage') return true;
          }
          return false;
        }),
      );
    } else {
      // Select all in module
      setSelectedIds((prev) => Array.from(new Set([...prev, ...modulePermIds])));
    }
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    await onSavePermissions(selectedIds);
  };

  if (isLoading || !roleDetail) {
    return (
      <Card className="border border-border h-full flex flex-col shadow-xs">
        {/* Matrix Header Skeleton */}
        <CardHeader className="py-3.5 px-5 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-5.5 w-44 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4.5 w-16 rounded-full" />
              <Skeleton className="h-4.5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-72 sm:w-96 rounded" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </CardHeader>

        {/* Matrix Filter Bar Skeleton */}
        <div className="px-5 py-2.5 border-b border-border bg-muted/10 flex items-center justify-between gap-3 shrink-0">
          <Skeleton className="h-8 w-64 max-w-sm rounded-md" />
          <Skeleton className="h-4 w-36 rounded hidden sm:block" />
        </div>

        {/* Matrix Modules List Skeleton */}
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
          {[1, 2, 3].map((moduleIdx) => (
            <div
              key={moduleIdx}
              className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs"
            >
              {/* Module Header Bar Skeleton */}
              <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-16 rounded hidden sm:inline" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded hidden sm:inline" />
                </div>
              </div>

              {/* Module Permissions Grid Skeleton */}
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((permIdx) => (
                  <div
                    key={permIdx}
                    className="p-2.5 rounded-lg border border-border/60 flex items-start gap-2.5 bg-muted/10"
                  >
                    <Skeleton className="size-4 rounded shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const isSystemRole = roleDetail.isSystem;

  return (
    <TooltipProvider>
      <Card className="border border-border h-full flex flex-col">
        {/* Role Header */}
        <CardHeader className="py-3.5 px-5 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <CardHeading className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Shield className="size-5 text-primary shrink-0" />
              <CardTitle className="text-base font-bold text-foreground truncate">
                {formatRoleName(roleDetail.name)}
              </CardTitle>
              <span className="font-mono text-xs text-muted-foreground">
                @{roleDetail.name}
              </span>

              {isSystemRole && (
                <Badge
                  variant="primary"
                  appearance="light"
                  size="xs"
                  className="gap-1 font-medium shrink-0"
                >
                  <ShieldCheck className="size-3" />
                  System Role
                </Badge>
              )}

              <Badge variant="secondary" size="xs" className="gap-1 font-mono shrink-0">
                <Users className="size-3" />
                {roleDetail.userCount} {roleDetail.userCount === 1 ? 'user' : 'users'}
              </Badge>
            </div>

            {roleDetail.description && (
              <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                {roleDetail.description}
              </CardDescription>
            )}
          </CardHeading>

          {/* Role Header Action Buttons */}
          {canManage && !isSystemRole && (
            <CardToolbar className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditRole}
                className="h-8 text-xs gap-1.5"
              >
                <Edit3 className="size-3.5" />
                Edit Role
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteRole}
                className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                Delete Role
              </Button>
            </CardToolbar>
          )}
        </CardHeader>

        {/* System Role Immutability Notice */}
        {isSystemRole && (
          <div className="px-5 pt-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-start gap-2.5">
              <ShieldCheck className="size-4.5 shrink-0 mt-0.5 text-primary" />
              <div className="leading-relaxed">
                <strong>System Role (Immutable):</strong> This role provides core system recovery and administrative integrity. It cannot be renamed, edited, or deleted from the interface. The permission matrix is displayed in read-only mode.
              </div>
            </div>
          </div>
        )}

        {/* Read-Only Notice if lacks roles:manage */}
        {!canManage && (
          <div className="px-5 pt-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-muted-foreground text-xs flex items-center gap-2">
              <Lock className="size-4 shrink-0 text-muted-foreground" />
              <span>
                <strong>Read-Only Mode:</strong> You have viewing privileges (<code>roles:view</code>). Modifying the permissions matrix requires <code>roles:manage</code> permission.
              </span>
            </div>
          </div>
        )}

        {/* Matrix Search & Info Filter Bar */}
        <div className="px-5 py-2.5 border-b border-border bg-muted/10 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter permissions by code or title..."
              className="h-8 text-xs ps-8 pe-7 bg-background"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5 shrink-0">
            <span>Configured:</span>
            <span className="font-mono font-bold text-foreground">
              {selectedIds.length} / {allPermissions.length}
            </span>
            <span>permissions</span>
          </div>
        </div>

        {/* Permission Matrix Body */}
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
          {Object.entries(groupedPermissions).map(([moduleKey, modulePerms]) => {
            // Apply search filter
            const filteredPerms = modulePerms.filter((p) => {
              if (!searchFilter.trim()) return true;
              const term = searchFilter.toLowerCase().trim();
              const meta = PERMISSION_METADATA[p.code];
              return (
                p.code.toLowerCase().includes(term) ||
                p.action.toLowerCase().includes(term) ||
                (meta?.title && meta.title.toLowerCase().includes(term)) ||
                (meta?.description && meta.description.toLowerCase().includes(term))
              );
            });

            if (filteredPerms.length === 0) return null;

            const moduleSelectedCount = modulePerms.filter((p) =>
              selectedIds.includes(p.id),
            ).length;
            const isAllSelected = moduleSelectedCount === modulePerms.length;
            const isIndeterminate =
              moduleSelectedCount > 0 && moduleSelectedCount < modulePerms.length;

            const moduleDisplayName =
              MODULE_NAMES[moduleKey] ||
              moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);

            return (
              <div
                key={moduleKey}
                className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs"
              >
                {/* Module Header Bar */}
                <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Module-level Checkbox (Select All / Deselect All for this module) */}
                    <Checkbox
                      checked={
                        isAllSelected ? true : isIndeterminate ? 'indeterminate' : false
                      }
                      onCheckedChange={() =>
                        handleToggleModule(moduleKey, modulePerms)
                      }
                      disabled={isSystemRole || !canManage}
                      className="size-4"
                    />

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">
                        {moduleDisplayName}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
                        ({moduleKey})
                      </span>
                    </div>
                  </div>

                  {/* Module Counter Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md border ${
                        moduleSelectedCount === modulePerms.length
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                          : moduleSelectedCount > 0
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-muted/50 text-muted-foreground border-border'
                      }`}
                    >
                      {moduleSelectedCount}/{modulePerms.length}
                    </span>

                    {!isSystemRole && canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleModule(moduleKey, modulePerms)}
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Module Permissions Grid */}
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredPerms.map((perm) => {
                    const isChecked = selectedIds.includes(perm.id);
                    const isSensitive = SENSITIVE_PERMISSIONS.includes(perm.code);
                    const meta = PERMISSION_METADATA[perm.code];

                    // Self-lockout check: logged-in user holds this role & perm is 'roles:manage'
                    const isSelfLockoutProtected =
                      isCurrentUserRole && perm.code === 'roles:manage';

                    return (
                      <div
                        key={perm.id}
                        onClick={() => {
                          if (!isSelfLockoutProtected && !isSystemRole && canManage) {
                            handleToggle(perm);
                          }
                        }}
                        className={`p-3 rounded-lg border transition-colors flex items-start gap-2.5 text-xs select-none ${
                          isSelfLockoutProtected
                            ? 'bg-muted/50 border-amber-500/40 cursor-not-allowed opacity-90'
                            : isSystemRole || !canManage
                            ? isChecked
                              ? 'bg-primary/5 border-primary/20 cursor-default'
                              : 'bg-muted/10 border-border cursor-default'
                            : isChecked
                            ? isSensitive
                              ? 'bg-rose-500/5 border-rose-500/30 cursor-pointer'
                              : 'bg-primary/5 border-primary/30 cursor-pointer'
                            : 'bg-background hover:bg-muted/40 border-border cursor-pointer'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isSelfLockoutProtected ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="size-4 rounded flex items-center justify-center bg-amber-500 text-white cursor-not-allowed">
                                  <Lock className="size-2.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs max-w-xs">
                                Protected: You cannot remove <code>roles:manage</code> from your own active role to prevent system lockout.
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggle(perm)}
                              disabled={isSystemRole || !canManage}
                              className="size-4"
                            />
                          )}
                        </div>

                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-semibold text-foreground text-xs">
                              {meta?.title || perm.action}
                            </span>

                            <div className="flex items-center gap-1">
                              {isSensitive && (
                                <Badge
                                  variant="destructive"
                                  appearance="light"
                                  size="xs"
                                  className="gap-0.5 text-[10px] font-medium"
                                  title="High privilege permission requiring careful delegation"
                                >
                                  <Flame className="size-2.5" />
                                  Sensitive
                                </Badge>
                              )}

                              {isSelfLockoutProtected && (
                                <Badge
                                  variant="warning"
                                  appearance="light"
                                  size="xs"
                                  className="gap-0.5 text-[10px] font-medium"
                                >
                                  Protected
                                </Badge>
                              )}
                            </div>
                          </div>

                          <span className="font-mono text-[11px] text-muted-foreground">
                            {perm.code}
                          </span>

                          {meta?.description && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {meta.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>

        {/* Sticky Bottom Action Bar */}
        {!isSystemRole && canManage && (
          <div className="p-3.5 border-t border-border bg-card/95 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              {hasChanges ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Pending:</span>
                  {addedPermissions.length > 0 && (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{addedPermissions.length} added
                    </span>
                  )}
                  {removedPermissions.length > 0 && (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      -{removedPermissions.length} removed
                    </span>
                  )}
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-muted-foreground">
                    Affects{' '}
                    <strong className="text-foreground font-semibold">
                      {roleDetail.userCount}
                    </strong>{' '}
                    {roleDetail.userCount === 1 ? 'user' : 'users'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span>Permissions are up to date with server</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="h-8 text-xs gap-1.5"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowConfirmDialog(true)}
                disabled={!hasChanges || isSaving}
                className="h-8 text-xs gap-1.5"
              >
                <Save className="size-3" />
                Save Permissions
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <RolePermissionsConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          role={roleDetail}
          addedPermissions={addedPermissions}
          removedPermissions={removedPermissions}
          newSelectedCount={selectedIds.length}
          onConfirm={handleConfirmSave}
          isSubmitting={isSaving}
        />
      </Card>
    </TooltipProvider>
  );
}
