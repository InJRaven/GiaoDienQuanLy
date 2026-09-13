import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { useApiQuery } from '@/hooks/use-api-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/common/container';
import { MenuDeleteDialog } from './components/menu-delete-dialog';
import { MenuFormSkeleton } from './components/menu-form-skeleton';
import { MenuItemForm } from './components/menu-item-form';
import { MenuTree } from './components/menu-tree';
import { MenuTreeSkeleton } from './components/menu-tree-skeleton';
import { findItemInTree } from './tree-utils';
import {
  AdminMenuItem,
  CreateMenuItemDto,
  PermissionOption,
  UpdateMenuItemDto,
} from './types';

export function MenuPage() {
  const { can, hasRole, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const canManage = can('menus:manage') || hasRole('admin') || isAdmin;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminMenuItem | null>(null);

  const {
    data: menuTree = [],
    isLoading: isTreeLoading,
    isFetching: isTreeFetching,
    refetch: refetchTree,
  } = useApiQuery<AdminMenuItem[]>(['menus', 'admin'], '/menu/admin', {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: permissions = [], isLoading: isPermsLoading } = useApiQuery<
    PermissionOption[]
  >(['menus', 'admin', 'permissions'], '/menu/admin/permissions', {
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const selectedItem = selectedId ? findItemInTree(menuTree, selectedId) : null;

  useEffect(() => {
    if (!selectedId && menuTree.length > 0 && !isCreateMode) {
      setSelectedId(menuTree[0].id);
    }
  }, [menuTree, selectedId, isCreateMode]);

  const invalidateAllMenus = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['menus', 'admin'] }),
      queryClient.invalidateQueries({ queryKey: ['menus', 'sidebar'] }),
    ]);
  }, [queryClient]);

  const handleSelectItem = (item: AdminMenuItem) => {
    setSelectedId(item.id);
    setIsCreateMode(false);
  };

  const handleOpenCreate = (targetParentId?: number | null) => {
    setIsCreateMode(true);
    setCreateParentId(
      targetParentId ?? (selectedItem ? selectedItem.parentId : null),
    );
  };

  const handleCancelCreate = () => {
    setIsCreateMode(false);
  };

  const handleSaveCreate = async (dto: CreateMenuItemDto) => {
    const res = await api.post<AdminMenuItem>('/menu/admin', dto);
    toast.success('Menu item created successfully.');
    await invalidateAllMenus();
    setIsCreateMode(false);
    if (res?.id) {
      setSelectedId(res.id);
    }
  };

  const handleSaveUpdate = async (id: number, dto: UpdateMenuItemDto) => {
    await api.patch(`/menu/admin/${id}`, dto);
    toast.success('Menu item changes saved.');
    await invalidateAllMenus();
  };

  const handleToggleActive = async (item: AdminMenuItem) => {
    const nextActive = !item.isActive;
    await api.patch(`/menu/admin/${item.id}`, { isActive: nextActive });
    toast.success(
      nextActive
        ? `Enabled display for "${item.title || item.key}" in menu.`
        : `Hidden "${item.title || item.key}" from menu.`,
    );
    await invalidateAllMenus();
  };

  const handleReorder = async (
    items: { id: number; parentId: number | null; sortOrder: number }[],
  ) => {
    try {
      await api.patch('/menu/admin/order', { items });
      toast.success('Menu order updated successfully.');
      await invalidateAllMenus();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'MENU_TOO_DEEP') {
        toast.error('Cannot move: Menu supports a maximum of 3 levels.');
      } else if (code === 'MENU_CYCLE') {
        toast.error('Cannot drop an item into its own descendant branch.');
      } else {
        toast.error('Failed to update menu order. Please try again.');
      }
      throw err;
    }
  };

  const handleConfirmDelete = async (item: AdminMenuItem) => {
    try {
      await api.delete(`/menu/admin/${item.id}`);
      toast.success(`Deleted item "${item.title || item.key}" successfully.`);
      if (selectedId === item.id) {
        setSelectedId(null);
      }
      await invalidateAllMenus();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'MENU_HAS_CHILDREN') {
        toast.error('Cannot delete because this item still has child items.');
      } else {
        toast.error('Failed to delete menu item. Please try again.');
      }
      throw err;
    }
  };

  const handleSwitchToDeactivate = async (item: AdminMenuItem) => {
    await api.patch(`/menu/admin/${item.id}`, { isActive: false });
    toast.success(`Hidden "${item.title || item.key}" from menu.`);
    await invalidateAllMenus();
  };

  if (!canManage) {
    return (
      <Container width="fluid" className="py-12">
        <Card className="max-w-md mx-auto border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center gap-3">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="size-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Access Denied
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You need the{' '}
              <code className="font-mono text-destructive">menus:manage</code>{' '}
              permission to view and manage system navigation menus.
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const isLoading = isTreeLoading || isPermsLoading;

  return (
    <Container width="fluid" className="flex flex-col gap-5 py-5">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle text="Menu Management" />
          <ToolbarDescription>
            Configure sidebar navigation items, hierarchy up to 3 levels, order,
            and route permissions.
          </ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => refetchTree()}
            disabled={isTreeFetching}
            title="Refresh menu data from server"
          >
            <RefreshCw
              className={`size-3.5 ${isTreeFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            className="font-medium gap-1.5 shadow-xs"
            onClick={() => handleOpenCreate(null)}
          >
            <Plus className="size-3.5" />
            Add Menu Item
          </Button>
        </ToolbarActions>
      </Toolbar>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5">
            <Card className="border border-border">
              <MenuTreeSkeleton />
            </Card>
          </div>
          <div className="lg:col-span-7">
            <Card className="border border-border">
              <MenuFormSkeleton />
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5">
            <MenuTree
              items={menuTree}
              selectedItem={selectedItem}
              onSelect={handleSelectItem}
              onOpenCreate={handleOpenCreate}
              onReorder={handleReorder}
              isReordering={isTreeFetching}
            />
          </div>
          <div className="lg:col-span-7">
            <MenuItemForm
              item={selectedItem}
              treeData={menuTree}
              permissions={permissions}
              isCreateMode={isCreateMode}
              createParentId={createParentId}
              onSaveCreate={handleSaveCreate}
              onSaveUpdate={handleSaveUpdate}
              onToggleActive={handleToggleActive}
              onOpenDelete={(it) => setDeleteItem(it)}
              onCancelCreate={handleCancelCreate}
              isLoading={isTreeFetching}
            />
          </div>
        </div>
      )}

      <MenuDeleteDialog
        item={deleteItem}
        open={Boolean(deleteItem)}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirmDelete={handleConfirmDelete}
        onSwitchToDeactivate={handleSwitchToDeactivate}
      />
    </Container>
  );
}
