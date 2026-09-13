import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import { useAuth } from '@/auth/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
import { useApiQuery } from '@/hooks/use-api-query';
import { PermissionItem, RoleDetail, RoleItem } from './types';
import { RoleList } from './components/role-list';
import { PermissionMatrix } from './components/permission-matrix';
import { RolesSkeleton } from './components/roles-skeleton';
import { RoleCreateDialog } from './components/role-create-dialog';
import { RoleEditDialog } from './components/role-edit-dialog';
import { RoleDeleteDialog } from './components/role-delete-dialog';

export function RolesPage() {
  const queryClient = useQueryClient();
  const { can, isAdmin, hasRole, roles: userRoles, refreshProfile } = useAuth();

  const canView = can('roles:view') || hasRole('admin') || isAdmin;
  const canManage = can('roles:manage') || hasRole('admin') || isAdmin;

  // Selected active role
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Fetch all roles
  const { data: roles = [], isLoading: isLoadingRoles } = useApiQuery<RoleItem[]>(
    ['roles'],
    '/roles',
    {
      enabled: canView,
      staleTime: 5 * 60 * 1000,
    },
  );

  // Fetch all available permissions in the system
  const { data: allPermissions = [] } = useApiQuery<PermissionItem[]>(
    ['roles', 'permissions'],
    '/roles/permissions',
    {
      enabled: canView,
      staleTime: 10 * 60 * 1000,
    },
  );

  // Auto-select first role when loaded or if current selected is gone
  useEffect(() => {
    if (roles.length > 0) {
      if (!selectedRoleId || !roles.some((r) => r.id === selectedRoleId)) {
        setSelectedRoleId(roles[0].id);
      }
    }
  }, [roles, selectedRoleId]);

  // Fetch detailed permissions for the active role
  const { data: roleDetail = null, isLoading: isLoadingRoleDetail } =
    useApiQuery<RoleDetail>(
      ['roles', selectedRoleId],
      `/roles/${selectedRoleId}`,
      {
        enabled: canView && selectedRoleId !== null,
        staleTime: 5 * 60 * 1000,
      },
    );

  // Handler: Save permissions matrix for active role
  const handleSavePermissions = async (permissionIds: number[]) => {
    if (!selectedRoleId || !roleDetail) return;
    setIsSavingPermissions(true);

    try {
      const updated = await api.put<RoleDetail>(
        `/roles/${selectedRoleId}/permissions`,
        { permissionIds },
      );

      // Immediately update query cache with new role detail
      queryClient.setQueryData(['roles', selectedRoleId], updated);

      // Invalidate roles list to update permission count badge
      queryClient.invalidateQueries({ queryKey: ['roles'] });

      // Invalidate system navigation menus in case user holds this role
      queryClient.invalidateQueries({ queryKey: ['menu'] });

      // If logged in user holds this role, refresh profile permissions
      if (userRoles.includes(roleDetail.name)) {
        await refreshProfile();
      }

      toast.success(
        `Permissions updated successfully for "${roleDetail.name}"!`,
      );
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      if (serverCode === 'ROLE_SELF_LOCKOUT') {
        toast.error(
          'Cannot remove roles:manage permission from your own role to prevent system lockout.',
        );
      } else if (serverCode === 'ROLE_IS_SYSTEM') {
        toast.error('System roles cannot be modified.');
      } else {
        toast.error(
          e?.response?.data?.message ||
            'An error occurred while updating permissions.',
        );
      }
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Handler: After role deletion, select another role
  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    const remaining = roles.filter((r) => r.id !== selectedRoleId);
    if (remaining.length > 0) {
      setSelectedRoleId(remaining[0].id);
    } else {
      setSelectedRoleId(null);
    }
  };

  // Handler: After role creation, select the new role
  const handleCreateSuccess = (newRoleId: number) => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    setSelectedRoleId(newRoleId);
  };

  // Handler: After role edit, invalidate cache
  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    queryClient.invalidateQueries({ queryKey: ['roles', selectedRoleId] });
  };

  // Access Denied Screen
  if (!canView) {
    return (
      <Container width="fluid" className="flex flex-col gap-5 py-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Roles & Permissions" />
            <ToolbarDescription>
              Manage system access roles and permission matrices.
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>

        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <Lock className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Access Denied
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You do not have permission (<code>roles:view</code>) to view the roles and permissions management console. Please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const isPageLoading =
    isLoadingRoles || (roles.length > 0 && selectedRoleId !== null && isLoadingRoleDetail);

  return (
    <Container width="fluid" className="flex flex-col gap-5 py-5">
      {/* Top Toolbar */}
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle text="Roles & Permissions" />
          <ToolbarDescription>
            Manage company access roles, user authorization matrices, and module security.
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>

      {/* Main 2-Column Content or Skeleton */}
      {isPageLoading ? (
        <RolesSkeleton />
      ) : (
        <div className="grid grid-cols-12 gap-5 items-start min-h-[calc(100vh-210px)]">
          {/* Left Column: Role List (4 cols on lg, 3 cols on xl) */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 h-full">
            <RoleList
              roles={roles}
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
              onAddRole={() => setCreateDialogOpen(true)}
              canManage={canManage}
              isLoading={isLoadingRoles}
            />
          </div>

          {/* Right Column: Permission Matrix (8 cols on lg, 9 cols on xl) */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 h-full">
            <PermissionMatrix
              roleDetail={roleDetail}
              allPermissions={allPermissions}
              currentUserRoles={userRoles}
              canManage={canManage}
              isLoading={isLoadingRoleDetail}
              onEditRole={() => setEditDialogOpen(true)}
              onDeleteRole={() => setDeleteDialogOpen(true)}
              onSavePermissions={handleSavePermissions}
              isSaving={isSavingPermissions}
            />
          </div>
        </div>
      )}

      {/* Role Dialogs */}
      <RoleCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        allPermissions={allPermissions}
        onSuccess={handleCreateSuccess}
      />

      <RoleEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        role={roleDetail}
        onSuccess={handleEditSuccess}
      />

      <RoleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        role={roleDetail}
        onSuccess={handleDeleteSuccess}
      />
    </Container>
  );
}
