import { useEffect, useMemo, useState } from 'react';
import { UniversalIcon } from '@/layouts/demo1/components/universal-icon';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  Plus,
  Save,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeading,
  CardToolbar,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { flattenTree } from '../tree-utils';
import {
  AdminMenuItem,
  BadgeVariant,
  CreateMenuItemDto,
  MenuItemType,
  PermissionOption,
  UpdateMenuItemDto,
} from '../types';
import { createMenuItemSchema, updateMenuItemSchema } from '../schemas';
import { IconPickerModal } from './icon-picker-modal';
import { MenuFormSkeleton } from './menu-form-skeleton';

interface MenuItemFormProps {
  item: AdminMenuItem | null;
  treeData: AdminMenuItem[];
  permissions: PermissionOption[];
  isCreateMode: boolean;
  createParentId?: number | null;
  onSaveCreate: (dto: CreateMenuItemDto) => Promise<void>;
  onSaveUpdate: (id: number, dto: UpdateMenuItemDto) => Promise<void>;
  onToggleActive: (item: AdminMenuItem) => Promise<void>;
  onOpenDelete: (item: AdminMenuItem) => void;
  onCancelCreate: () => void;
  isLoading?: boolean;
}

const formatModuleName = (moduleName: string): string => {
  const customNames: Record<string, string> = {
    attendance_config: 'Attendance Config',
    coursera_api_keys: 'Coursera API Keys',
    customer_orders: 'Customer Orders',
    collaborator_orders: 'Collaborator Orders',
    shift_rates: 'Shift Rates',
  };
  if (customNames[moduleName]) return customNames[moduleName];
  return moduleName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const resolveItemPermissionId = (
  targetItem: AdminMenuItem | null,
  perms: PermissionOption[],
): number | null => {
  if (!targetItem) return null;
  if (
    targetItem.permissionId !== null &&
    targetItem.permissionId !== undefined
  ) {
    return Number(targetItem.permissionId);
  }
  if (
    (targetItem as any).permission_id !== null &&
    (targetItem as any).permission_id !== undefined
  ) {
    return Number((targetItem as any).permission_id);
  }
  if (targetItem.permission && perms && perms.length > 0) {
    const found = perms.find(
      (p) =>
        p.code === targetItem.permission || p.name === targetItem.permission,
    );
    if (found) return found.id;
  }
  return null;
};

export function MenuItemForm({
  item,
  treeData,
  permissions,
  isCreateMode,
  createParentId = null,
  onSaveCreate,
  onSaveUpdate,
  onToggleActive,
  onOpenDelete,
  onCancelCreate,
  isLoading = false,
}: MenuItemFormProps) {
  // Form values
  const [key, setKey] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [type, setType] = useState<MenuItemType>('item');
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');
  const [icon, setIcon] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeVariant, setBadgeVariant] = useState<BadgeVariant>('primary');
  const [permissionId, setPermissionId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isExternal, setIsExternal] = useState(false);
  const [isCollapse, setIsCollapse] = useState(false);
  const [collapseTitle, setCollapseTitle] = useState('');
  const [expandTitle, setExpandTitle] = useState('');

  // Form field errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when selected item or mode changes
  useEffect(() => {
    setErrors({});
    if (isCreateMode) {
      setKey('');
      setParentId(createParentId);
      setType('item');
      setTitle('');
      setPath('');
      setIcon('');
      setBadge('');
      setBadgeVariant('primary');
      setPermissionId(null);
      setIsActive(true);
      setIsExternal(false);
      setIsCollapse(false);
      setCollapseTitle('');
      setExpandTitle('');
    } else if (item) {
      setKey(item.key || '');
      setParentId(item.parentId);
      setType(item.type || 'item');
      setTitle(item.title || '');
      setPath(item.path || '');
      setIcon(item.icon || '');
      setBadge(item.badge || '');
      setBadgeVariant((item.badgeVariant as BadgeVariant) || 'primary');
      setPermissionId(resolveItemPermissionId(item, permissions));
      setIsActive(item.isActive);
      setIsExternal(item.isExternal);
      setIsCollapse(item.isCollapse);
      setCollapseTitle(item.collapseTitle || '');
      setExpandTitle(item.expandTitle || '');
    }
  }, [item, isCreateMode, createParentId, permissions]);

  // Re-sync permissionId when permissions finish loading if item has permission info
  useEffect(() => {
    if (
      !isCreateMode &&
      item &&
      permissions.length > 0 &&
      permissionId === null
    ) {
      const resolved = resolveItemPermissionId(item, permissions);
      if (resolved !== null) {
        setPermissionId(resolved);
      }
    }
  }, [permissions, item, isCreateMode, permissionId]);

  // Group permissions by module for structured select display
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionOption[]> = {};
    for (const perm of permissions) {
      const mod = perm.module || 'other';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(perm);
    }
    return groups;
  }, [permissions]);

  const sortedModuleEntries = useMemo(() => {
    return Object.entries(groupedPermissions).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [groupedPermissions]);

  const isSelectedPermMissing =
    permissionId !== null &&
    permissions.length > 0 &&
    !permissions.some((p) => p.id === permissionId);

  // List of potential parents (up to depth 2 so children don't exceed depth 3)
  const potentialParents = useMemo(() => {
    const flat = flattenTree(treeData, 1);
    // When editing, exclude current item and all its descendants to prevent cycles
    return flat.filter((f) => {
      if (f.depth > 2) return false; // depth 3 cannot have children
      if (f.item.type === 'separator') return false; // separator cannot have children
      if (!isCreateMode && item && f.item.id === item.id) return false;
      return true;
    });
  }, [treeData, isCreateMode, item]);

  // Client-side validation using Zod
  const validateForm = (): boolean => {
    const formData = {
      key,
      type,
      title,
      path,
      icon,
      badge,
      badgeVariant,
      permissionId,
      parentId,
      isExternal,
      isCollapse,
      collapseTitle,
      expandTitle,
    };

    const result = isCreateMode
      ? createMenuItemSchema.safeParse(formData)
      : updateMenuItemSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!newErrors[field]) {
          newErrors[field] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Handle server error code mapping
  const handleServerErrorCode = (code?: string, defaultMsg?: string) => {
    switch (code) {
      case 'DUPLICATE_RESOURCE':
        setErrors((prev) => ({
          ...prev,
          key: 'This key already exists in the system. Please choose another key.',
        }));
        toast.error('Key duplicated in the system.');
        break;
      case 'MENU_ITEM_NEEDS_TITLE':
        setErrors((prev) => ({
          ...prev,
          title: 'Clickable menu item must have a title.',
        }));
        break;
      case 'MENU_NONITEM_HAS_PATH':
        setErrors((prev) => ({
          ...prev,
          path: 'Heading hoặc Separator cannot have a path.',
        }));
        break;
      case 'MENU_COLLAPSE_HAS_PATH':
        setErrors((prev) => ({
          ...prev,
          path: 'Collapsed group item cannot have a path.',
        }));
        break;
      case 'MENU_EXTERNAL_NEEDS_PATH':
        setErrors((prev) => ({
          ...prev,
          path: 'External link must have a full URL (https://...).',
        }));
        break;
      case 'MENU_TOO_DEEP':
        toast.error('Menu supports a maximum of 3 levels.');
        break;
      case 'MENU_CYCLE':
        toast.error('Cannot nest item inside itself or its children.');
        break;
      case 'RESOURCE_NOT_FOUND':
        toast.error('This item no longer exists on the server.');
        break;
      default:
        toast.error(defaultMsg || 'Cannot save menu item. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (isCreateMode) {
        const dto: CreateMenuItemDto = {
          key: key.trim(),
          parentId: parentId || null,
          type,
          title: type !== 'separator' ? title.trim() || null : null,
          path: type === 'item' && !isCollapse ? path.trim() || null : null,
          icon: type === 'item' ? icon.trim() || null : null,
          badge: type === 'item' ? badge.trim() || null : null,
          badgeVariant: type === 'item' && badge.trim() ? badgeVariant : null,
          permissionId: type === 'item' ? permissionId : null,
          isActive,
          isExternal: type === 'item' ? isExternal : false,
          isCollapse: type === 'item' ? isCollapse : false,
          collapseTitle:
            type === 'item' && isCollapse ? collapseTitle.trim() || null : null,
          expandTitle:
            type === 'item' && isCollapse ? expandTitle.trim() || null : null,
        };
        await onSaveCreate(dto);
      } else if (item) {
        // Compute DIRTY FIELDS only
        const patchDto: UpdateMenuItemDto = {};

        if (type !== item.type) patchDto.type = type;
        if (parentId !== item.parentId) patchDto.parentId = parentId || null;

        const newTitle = type !== 'separator' ? title.trim() || null : null;
        if (newTitle !== item.title) patchDto.title = newTitle;

        const newPath =
          type === 'item' && !isCollapse ? path.trim() || null : null;
        if (newPath !== item.path) patchDto.path = newPath;

        const newIcon = type === 'item' ? icon.trim() || null : null;
        if (newIcon !== item.icon) patchDto.icon = newIcon;

        const newBadge = type === 'item' ? badge.trim() || null : null;
        if (newBadge !== item.badge) patchDto.badge = newBadge;

        const newBadgeVariant =
          type === 'item' && badge.trim() ? badgeVariant : null;
        if (newBadgeVariant !== item.badgeVariant)
          patchDto.badgeVariant = newBadgeVariant;

        const originalPermId = resolveItemPermissionId(item, permissions);
        const newPermId = type === 'item' ? permissionId : null;
        if (newPermId !== originalPermId) patchDto.permissionId = newPermId;

        if (isActive !== item.isActive) patchDto.isActive = isActive;

        const newExternal = type === 'item' ? isExternal : false;
        if (newExternal !== item.isExternal) patchDto.isExternal = newExternal;

        const newCollapse = type === 'item' ? isCollapse : false;
        if (newCollapse !== item.isCollapse) patchDto.isCollapse = newCollapse;

        const newCollapseTitle =
          type === 'item' && isCollapse ? collapseTitle.trim() || null : null;
        if (newCollapseTitle !== item.collapseTitle)
          patchDto.collapseTitle = newCollapseTitle;

        const newExpandTitle =
          type === 'item' && isCollapse ? expandTitle.trim() || null : null;
        if (newExpandTitle !== item.expandTitle)
          patchDto.expandTitle = newExpandTitle;

        if (Object.keys(patchDto).length === 0) {
          toast.info('No changes to save.');
          return;
        }

        await onSaveUpdate(item.id, patchDto);
      }
    } catch (err: any) {
      const serverCode = err?.response?.data?.code;
      const message = err?.response?.data?.message;
      handleServerErrorCode(serverCode, message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!item && !isCreateMode) {
    if (isLoading) {
      return (
        <Card className="flex flex-col h-full border border-border">
          <MenuFormSkeleton />
        </Card>
      );
    }

    return (
      <Card className="flex flex-col h-full border border-border">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground my-auto">
          <Info className="size-8 text-muted-foreground/60 mb-2 stroke-1" />
          <p className="text-sm font-medium text-foreground">
            No menu item selected
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Chọn một mục từ cây menu bên trái để chỉnh sửa, hoặc bấm &ldquo;Thêm
            mục mới&rdquo; để tạo mục mới.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border border-border">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Header */}
        <CardHeader className="py-4 px-6 border-b border-border flex items-center justify-between gap-3">
          <CardHeading className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              {isCreateMode ? (
                <Plus className="size-4" />
              ) : (
                <UniversalIcon
                  icon={icon || 'lucide:Folder'}
                  className="size-4"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {isCreateMode ? 'Add new menu item' : `Edit: ${title || key}`}
                </h2>
                {isLoading && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              {!isCreateMode && (
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {item?.id} • Key: {key}
                </p>
              )}
            </div>
          </CardHeading>

          <CardToolbar className="flex items-center gap-2">
            {isCreateMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-sm"
                onClick={onCancelCreate}
                disabled={isSaving || isLoading}
              >
                <X className="size-4 me-1" />
                Cancel creation
              </Button>
            )}

            {!isCreateMode && item && (
              <>
                <Button
                  type="button"
                  variant={isActive ? 'ghost' : 'secondary'}
                  size="sm"
                  className={`h-9 px-3 text-sm font-medium ${
                    isActive
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-primary'
                  }`}
                  onClick={() => onToggleActive(item)}
                  disabled={isSaving || isLoading}
                  title={isActive ? 'Hide from menu' : 'Show on menu'}
                >
                  {isActive ? (
                    <>
                      <EyeOff className="size-4 me-1" />
                      Hide item
                    </>
                  ) : (
                    <>
                      <Eye className="size-4 me-1" />
                      Enable item
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  size="sm"
                  className="size-7 text-destructive hover:bg-destructive/10"
                  onClick={() => onOpenDelete(item)}
                  disabled={isSaving || isLoading}
                  title="Delete this item"
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </CardToolbar>
        </CardHeader>

        {/* Body */}
        <CardContent className="p-6 space-y-4 overflow-y-auto grow text-sm">
          {/* Notice Banner */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/80 bg-muted/30 text-muted-foreground text-xs leading-relaxed">
            <HelpCircle className="size-4 text-primary shrink-0 mt-0.5" />
            <span>
              This screen configures the links displayed on the Sidebar.
              <strong> Hiding an item only hides the displayed link</strong>,
              người dùng có quyền API vẫn có thể truy cập qua URL trực tiếp.
            </span>
          </div>

          {/* Type Selector (Tabs) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Item Type</Label>
            <Tabs
              value={type}
              onValueChange={(val) => {
                const nextType = val as MenuItemType;
                setType(nextType);
                if (nextType === 'separator') {
                  setPath('');
                  setIcon('');
                  setPermissionId(null);
                } else if (nextType === 'heading') {
                  setPath('');
                  setIcon('');
                  setPermissionId(null);
                }
              }}
            >
              <TabsList className="grid grid-cols-3 h-10 w-full">
                <TabsTrigger value="item" className="">
                  Link Item
                </TabsTrigger>
                <TabsTrigger value="heading" className="">
                  Group Heading
                </TabsTrigger>
                <TabsTrigger value="separator" className="">
                  Separator
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Key & Parent row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
            {/* Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="menu-key"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  Identifier Key
                  {!isCreateMode && (
                    <Lock className="size-3.5 text-muted-foreground" />
                  )}
                </Label>
                {!isCreateMode && (
                  <Badge
                    variant="outline"
                    size="sm"
                    className="text-xs py-0 text-muted-foreground"
                  >
                    Read-only
                  </Badge>
                )}
              </div>

              <Input
                id="menu-key"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().trim())}
                disabled={!isCreateMode || isSaving || isLoading}
                placeholder="vd: cs_subjects, hr_employees"
                className={`h-10 text-sm font-mono ${
                  errors.key
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
              />
              {errors.key ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {errors.key}
                </p>
              ) : isCreateMode ? (
                <p className="text-xs text-muted-foreground">
                  Chữ thường, số, gạch dưới, bắt đầu bằng chữ. Không sửa được
                  sau khi tạo.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Fixed key for database synchronization, cannot be edited.
                </p>
              )}
            </div>

            {/* Parent selector */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Parent Item (Level)</Label>
              <Select
                value={parentId === null ? 'root' : String(parentId)}
                onValueChange={(val) =>
                  setParentId(val === 'root' ? null : Number(val))
                }
                disabled={isSaving || isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select parent item" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="root">
                    <span className="font-semibold text-primary">
                      — Level 1 (Root) —
                    </span>
                  </SelectItem>
                  {potentialParents.map((p) => (
                    <SelectItem key={p.item.id} value={String(p.item.id)}>
                      {p.depth === 2 ? '　↳ ' : ''}
                      {p.item.title || p.item.key} (Cấp {p.depth})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Maximum 3 levels deep.
              </p>
            </div>
          </div>

          {/* Title (for item & heading) */}
          {type !== 'separator' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-title" className="text-sm font-medium">
                Display Title {type === 'item' ? '(Required)' : ''}
              </Label>
              <Input
                id="menu-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving || isLoading}
                placeholder={
                  type === 'heading'
                    ? 'vd: QUẢN LÝ HỆ THỐNG'
                    : 'vd: Môn học, Bảng điều khiển'
                }
                className={`h-10 text-sm ${
                  errors.title
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
              />
              {errors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {errors.title}
                </p>
              )}
            </div>
          )}

          {/* Path & External Link */}
          {type === 'item' && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="menu-path" className="text-sm font-medium">
                    Path / URL
                  </Label>
                  {isCollapse && (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="text-xs text-muted-foreground"
                    >
                      Not applicable for collapsed group item
                    </Badge>
                  )}
                </div>

                <Input
                  id="menu-path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  disabled={isCollapse || isSaving || isLoading}
                  placeholder={
                    isExternal
                      ? 'https://example.com'
                      : isCollapse
                        ? 'Mục xem thêm không có đường dẫn'
                        : '/coursera/subjects'
                  }
                  className={`h-10 text-sm font-mono ${
                    errors.path
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {errors.path && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    {errors.path}
                  </p>
                )}
              </div>

              {/* isExternal toggle */}
              {!isCollapse && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      External Link
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mở tab mới, bắt buộc URL đầy đủ bắt đầu bằng http:// hoặc
                      https://
                    </p>
                  </div>
                  <Switch
                    checked={isExternal}
                    onCheckedChange={(checked) => setIsExternal(checked)}
                    disabled={isSaving || isLoading}
                  />
                </div>
              )}

              {/* isCollapse toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Mục gom nhóm &ldquo;Xem thêm&rdquo; (isCollapse)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dùng để gom các mục con vào nhóm có nút Xem thêm / Thu gọn.
                    Cấm có đường dẫn.
                  </p>
                </div>
                <Switch
                  checked={isCollapse}
                  onCheckedChange={(checked) => {
                    setIsCollapse(checked);
                    if (checked) {
                      setPath('');
                      setIsExternal(false);
                    }
                  }}
                  disabled={isSaving || isLoading}
                />
              </div>

              {/* Collapse Titles */}
              {isCollapse && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">
                      Collapse Title
                    </Label>
                    <Input
                      value={collapseTitle}
                      onChange={(e) => setCollapseTitle(e.target.value)}
                      disabled={isSaving || isLoading}
                      placeholder="vd: Thu gọn"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Expand Title</Label>
                    <Input
                      value={expandTitle}
                      onChange={(e) => setExpandTitle(e.target.value)}
                      disabled={isSaving || isLoading}
                      placeholder="vd: Xem thêm"
                      className="bg-background"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Icon & Permission (for item) */}
          {type === 'item' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Icon selector */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="menu-icon" className="text-sm font-medium">
                    Icon
                  </Label>
                  {icon && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Preview:</span>
                      <div className="p-0.5 bg-muted rounded border border-border">
                        <UniversalIcon
                          icon={icon}
                          className="size-4 text-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id="menu-icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    disabled={isSaving || isLoading}
                    placeholder="vd: keen:duotone:book-open hoặc lucide:Users"
                    className="font-mono grow"
                  />
                  <IconPickerModal value={icon} onChange={setIcon} />
                </div>
              </div>

              {/* Permission */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="menu-permission"
                    className="text-sm font-medium"
                  >
                    Permission
                  </Label>
                  {permissionId !== null && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                      onClick={() => setPermissionId(null)}
                      disabled={isSaving || isLoading}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Select
                  value={
                    permissionId === null || permissionId === undefined
                      ? 'none'
                      : String(permissionId)
                  }
                  onValueChange={(val) =>
                    setPermissionId(val === 'none' ? null : Number(val))
                  }
                  disabled={isSaving || isLoading}
                >
                  <SelectTrigger id="menu-permission" className="w-full">
                    <SelectValue placeholder="No permission required (Public)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 w-(--radix-select-trigger-width) min-w-[340px] p-1.5">
                    <SelectItem
                      value="none"
                      textValue="No permission required (Public)"
                      className="cursor-pointer text-xs font-medium py-2 rounded-md"
                    >
                      <span className="text-muted-foreground italic">
                        No permission required (Public)
                      </span>
                    </SelectItem>

                    {isSelectedPermMissing && (
                      <SelectItem
                        value={String(permissionId)}
                        textValue={
                          item?.permission || `Permission #${permissionId}`
                        }
                        className="cursor-pointer text-xs py-1.5 rounded-md"
                      >
                        <span className="font-mono text-xs text-amber-500">
                          {item?.permission || `Permission #${permissionId}`}{' '}
                          (Current)
                        </span>
                      </SelectItem>
                    )}

                    {sortedModuleEntries.map(([moduleName, perms]) => (
                      <SelectGroup key={moduleName}>
                        <SelectSeparator className="my-1.5" />
                        <SelectLabel className="ps-2.5! pe-2.5! flex items-center gap-2 py-1.5 my-1 text-xs font-semibold text-foreground bg-muted/90 dark:bg-muted/60 rounded-md border border-border/70 select-none">
                          <div className="w-1 h-3.5 rounded-full bg-primary shrink-0" />
                          <Shield className="size-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-xs text-foreground tracking-wide">
                            {formatModuleName(moduleName)}
                          </span>
                          <span className="ms-auto text-[10px] font-mono font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/60">
                            {perms.length}{' '}
                            {perms.length === 1 ? 'perm' : 'perms'}
                          </span>
                        </SelectLabel>
                        {perms.map((p) => {
                          const label =
                            p.code || p.name || `permission-${p.id}`;
                          return (
                            <SelectItem
                              key={p.id}
                              value={String(p.id)}
                              textValue={label}
                              className="my-0.5 cursor-pointer text-xs rounded-md"
                            >
                              <div className="flex items-center justify-between gap-3 w-full">
                                <span className="font-mono text-xs text-foreground font-medium truncate">
                                  {label}
                                </span>
                                {p.action && (
                                  <span
                                    className={cn(
                                      'text-[10px] uppercase px-1.5 py-0.5 rounded font-mono font-semibold shrink-0',
                                      p.action === 'view' &&
                                        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
                                      p.action === 'create' &&
                                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                                      p.action === 'update' &&
                                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
                                      p.action === 'delete' &&
                                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
                                      p.action === 'approve' &&
                                        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
                                      p.action === 'manage' &&
                                        'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
                                      ![
                                        'view',
                                        'create',
                                        'update',
                                        'delete',
                                        'approve',
                                        'manage',
                                      ].includes(p.action) &&
                                        'bg-muted text-muted-foreground border border-border/50',
                                    )}
                                  >
                                    {p.action}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only users with this permission will see the link on the
                  sidebar.
                </p>
              </div>
            </div>
          )}

          {/* Badge text & Badge Variant */}
          {type === 'item' && (
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="flex flex-col gap-1">
                <Label htmlFor="menu-badge" className="text-sm font-medium">
                  Badge Text
                </Label>
                <Input
                  id="menu-badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  disabled={isSaving || isLoading}
                  placeholder="vd: Mới, Pro, v9.5"
                  className=""
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Badge Color</Label>
                <Select
                  value={badgeVariant}
                  onValueChange={(val) => setBadgeVariant(val as BadgeVariant)}
                  disabled={!badge.trim() || isSaving || isLoading}
                >
                  <SelectTrigger className="">
                    <SelectValue placeholder="Badge Color" />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectItem value="primary">Primary (Blue)</SelectItem>
                    <SelectItem value="success">Success (Green)</SelectItem>
                    <SelectItem value="warning">Warning (Yellow)</SelectItem>
                    <SelectItem value="destructive">
                      Destructive (Red)
                    </SelectItem>
                    <SelectItem value="info">Info (Light Blue)</SelectItem>
                    <SelectItem value="secondary">Secondary (Gray)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-foreground text-sm">
                  {isActive ? 'Visible on menu' : 'Hidden from menu'}
                </p>
                <Badge
                  variant={isActive ? 'success' : 'destructive'}
                  appearance="light"
                  size="sm"
                  className="text-xs"
                >
                  {isActive ? 'Active' : 'Hidden'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isActive
                  ? 'This item (and its children) will appear on the sidebar for users with adequate permissions.'
                  : 'This item (and its children) will be hidden from the sidebar for everyone.'}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked)}
              disabled={isSaving || isLoading}
            />
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="py-4 px-6 border-t border-border flex items-center justify-end gap-2.5">
          {isCreateMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className=""
                onClick={onCancelCreate}
                disabled={isSaving || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-10 text-sm font-medium gap-1.5 shadow-xs"
                disabled={isSaving || isLoading}
              >
                {isSaving || isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {isSaving
                  ? 'Creating...'
                  : isLoading
                    ? 'Processing...'
                    : 'Create menu item'}
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              size="sm"
              className="h-10 text-sm font-medium gap-1.5 shadow-xs"
              disabled={isSaving || isLoading}
            >
              {isSaving || isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSaving
                ? 'Saving...'
                : isLoading
                  ? 'Processing...'
                  : 'Save changes'}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
