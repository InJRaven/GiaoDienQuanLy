import { useMemo, useState, useEffect } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  RefreshCw,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  KeyRound,
  ShieldCheck,
  Power,
  X,
  AlertTriangle,
  Mail,
  UserCheck,
  Eye,
  UserCircle,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/context/auth-context';
import { useApiQuery } from '@/hooks/use-api-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinDelay } from '@/hooks/use-min-delay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import {
  EmploymentStatus,
  formatRoleName,
  UserListItem,
  UserListResponse,
  UserRole,
  UserSortBy,
} from '../types';
import { UserTableSkeleton } from './user-table-skeleton';
import { UserCreateDialog } from './user-create-dialog';
import { UserEditDialog } from './user-edit-dialog';
import { UserStatusDialog } from './user-status-dialog';
import { UserRolesDialog } from './user-roles-dialog';
import { UserResetPasswordDialog } from './user-reset-password-dialog';
import { UserDeleteDialog } from './user-delete-dialog';
import { UserDetailsDialog } from './user-details-dialog';

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'Never';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function UserTable() {
  const navigate = useNavigate();
  const { user: currentUser, profile: currentProfile, can } = useAuth();
  const currentUserId = currentUser?.id || currentProfile?.id;

  // Permission checks
  const canCreate = can('users:create');
  const canUpdate = can('users:update');
  const canAssignRoles = can('roles:assign');
  const canDelete = can('users:delete');

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [statusUser, setStatusUser] = useState<UserListItem | null>(null);
  const [rolesUser, setRolesUser] = useState<UserListItem | null>(null);
  const [resetPasswordUser, setResetPasswordUser] =
    useState<UserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);
  const [detailsUser, setDetailsUser] = useState<UserListItem | null>(null);

  // TanStack Table Pagination & Sorting
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);

  // Search input with 350ms debounce
  const [searchInputValue, setSearchInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInputValue.trim();
      setDebouncedSearch(trimmed);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Filter States
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(false);

  // Fetch available roles for filter dropdown
  const { data: availableRoles = [] } = useApiQuery<UserRole[]>(
    ['users', 'roles'],
    '/users/roles',
    {
      staleTime: 5 * 60 * 1000,
    },
  );

  // When unassignedOnly is activated, clear roleFilter (submitting both causes 400)
  const handleToggleUnassigned = () => {
    setUnassignedOnly((prev) => {
      const next = !prev;
      if (next) {
        setRoleFilter('all');
      }
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      return next;
    });
  };

  const handleRoleChange = (val: string) => {
    setRoleFilter(val);
    if (val !== 'all') {
      setUnassignedOnly(false);
    }
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleResetFilters = () => {
    setSearchInputValue('');
    setDebouncedSearch('');
    setEmploymentStatusFilter('all');
    setIsActiveFilter('all');
    setRoleFilter('all');
    setUnassignedOnly(false);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  // Build query params for GET /users
  const queryParams: Record<string, any> = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  };

  // Only send search if non-empty
  if (debouncedSearch) {
    queryParams.search = debouncedSearch;
  }

  // Sort parameter (valid 7 columns)
  if (sorting.length > 0) {
    queryParams.sortBy = sorting[0].id as UserSortBy;
    queryParams.order = sorting[0].desc ? 'desc' : 'asc';
  } else {
    queryParams.sortBy = 'created_at';
    queryParams.order = 'desc';
  }

  // Employment status filter
  if (employmentStatusFilter !== 'all') {
    queryParams.employmentStatus = employmentStatusFilter as EmploymentStatus;
  }

  // IsActive filter
  if (isActiveFilter === 'active') {
    queryParams.isActive = true;
  } else if (isActiveFilter === 'inactive') {
    queryParams.isActive = false;
  }

  // Role filter vs Unassigned (mutually exclusive)
  if (unassignedOnly) {
    queryParams.unassigned = true;
  } else if (roleFilter !== 'all') {
    queryParams.roleId = Number(roleFilter);
  }

  // Query Backend API
  const { data, isLoading, refetch, isFetching } = useApiQuery<UserListResponse>(
    ['users', 'list', queryParams],
    '/users',
    {
      params: queryParams,
      placeholderData: keepPreviousData,
      staleTime: 0,
    },
  );

  // Minimum duration skeleton handling (initial: 800ms, search/filter: 650ms)
  const { showInitialSkeleton, isTableLoading } = useMinDelay({
    isLoading,
    isFetching,
    hasData: !!data,
    triggerKey: queryParams,
    options: {
      initialDelay: 800,
      subsequentDelay: 650,
    },
  });

  const items = data?.items || [];
  const meta = data?.meta;

  const headerClass =
    'font-bold text-foreground text-xs uppercase tracking-wider select-none';

  // Define Columns
  const columns = useMemo<ColumnDef<UserListItem>[]>(
    () => [
      {
        id: 'full_name',
        accessorFn: (row) => row.fullName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Employee"
            column={column}
            className={headerClass}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUserId;

          return (
            <div className="flex items-center gap-2.5 py-1">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {user.fullName.charAt(0) || user.username.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    onClick={() => setDetailsUser(user)}
                    className="font-semibold text-xs text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                    title="Click to view details"
                  >
                    {user.fullName}
                  </span>
                  {user.employeeCode && (
                    <Badge variant="outline" size="xs" className="font-mono text-[10px]">
                      {user.employeeCode}
                    </Badge>
                  )}
                  {isSelf && (
                    <Badge variant="secondary" size="xs" className="text-[10px]">
                      You
                    </Badge>
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  @{user.username}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 200,
        meta: {
          headerClassName: 'min-w-[200px]',
          cellClassName: 'min-w-[200px]',
          skeleton: <Skeleton className="h-4 w-28 rounded" />,
        },
      },
      {
        id: 'department',
        accessorFn: (row) => row.department,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Email & Department"
            column={column}
            className={headerClass}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex flex-col gap-0.5 py-1">
              {user.email ? (
                <a
                  href={`mailto:${user.email}`}
                  className="text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
                  title={user.email}
                >
                  <Mail className="size-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.email}</span>
                </a>
              ) : (
                <span className="text-xs text-muted-foreground/60 italic">
                  No email
                </span>
              )}
              <span className="text-[11px] text-muted-foreground truncate">
                {user.department || 'Unassigned'}
              </span>
            </div>
          );
        },
        enableSorting: true,
        size: 180,
        meta: {
          headerClassName: 'min-w-[180px]',
          cellClassName: 'min-w-[180px]',
          skeleton: <Skeleton className="h-4 w-32 rounded" />,
        },
      },
      {
        id: 'roles',
        header: () => (
          <span className={headerClass}>Roles</span>
        ),
        cell: ({ row }) => {
          const user = row.original;
          const roles = user.roles || [];

          if (roles.length === 0) {
            return (
              <button
                type="button"
                onClick={() => canAssignRoles && setRolesUser(user)}
                disabled={!canAssignRoles}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 ${
                  canAssignRoles ? 'hover:bg-amber-500/20 cursor-pointer' : ''
                }`}
                title={canAssignRoles ? 'Click to assign roles' : 'No roles assigned'}
              >
                <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                No roles assigned
              </button>
            );
          }

          return (
            <div
              className={`flex flex-wrap gap-1 py-1 ${
                canAssignRoles ? 'cursor-pointer' : ''
              }`}
              onClick={() => canAssignRoles && setRolesUser(user)}
              title={canAssignRoles ? 'Click to manage roles' : undefined}
            >
              {roles.map((r) => (
                <Badge
                  key={r.id}
                  variant="secondary"
                  size="xs"
                  className="text-[10px] font-normal"
                >
                  {formatRoleName(r.name)}
                </Badge>
              ))}
            </div>
          );
        },
        enableSorting: false,
        size: 160,
        meta: {
          headerClassName: 'min-w-[160px]',
          cellClassName: 'min-w-[160px]',
          skeleton: <Skeleton className="h-5 w-24 rounded" />,
        },
      },
      {
        id: 'employmentStatus',
        header: () => (
          <span className={headerClass}>Employment</span>
        ),
        cell: ({ row }) => {
          const status = row.original.employmentStatus;
          if (status === 'active') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            );
          }
          if (status === 'on_leave') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-amber-500" />
                On Leave
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-destructive" />
              Terminated
            </span>
          );
        },
        enableSorting: false,
        size: 130,
        meta: {
          headerClassName: 'w-[130px] min-w-[120px]',
          cellClassName: 'w-[130px] min-w-[120px]',
          skeleton: <Skeleton className="h-5 w-20 rounded-full" />,
        },
      },
      {
        id: 'isActive',
        header: () => (
          <span className={headerClass}>Login Access</span>
        ),
        cell: ({ row }) => {
          const active = Boolean(row.original.isActive);
          return active ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
              Locked
            </span>
          );
        },
        enableSorting: false,
        size: 110,
        meta: {
          headerClassName: 'w-[110px] min-w-[100px]',
          cellClassName: 'w-[110px] min-w-[100px]',
          skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
        },
      },
      {
        id: 'hire_date',
        accessorFn: (row) => row.hireDate,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Hire Date"
            column={column}
            className={headerClass}
          />
        ),
        cell: (info) => (
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {formatDate(info.getValue() as string)}
          </span>
        ),
        enableSorting: true,
        size: 110,
        meta: {
          headerClassName: 'w-[110px] min-w-[100px]',
          cellClassName: 'w-[110px] min-w-[100px]',
          skeleton: <Skeleton className="h-4 w-16 rounded" />,
        },
      },
      {
        id: 'last_login_at',
        accessorFn: (row) => row.lastLoginAt,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Last Login"
            column={column}
            className={headerClass}
          />
        ),
        cell: (info) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(info.getValue() as string)}
          </span>
        ),
        enableSorting: true,
        size: 120,
        meta: {
          headerClassName: 'w-[120px] min-w-[110px]',
          cellClassName: 'w-[120px] min-w-[110px]',
          skeleton: <Skeleton className="h-4 w-16 rounded" />,
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUserId;

          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => navigate(`/users/${user.id}/profile`)}>
                    <UserCircle className="size-4 mr-2 text-primary" /> Trang hồ sơ
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setDetailsUser(user)}>
                    <Eye className="size-4 mr-2" /> View Details
                  </DropdownMenuItem>

                  {canUpdate && (
                    <DropdownMenuItem onClick={() => setEditUser(user)}>
                      <Edit className="size-4 mr-2" /> Edit Profile
                    </DropdownMenuItem>
                  )}

                  {canUpdate && (
                    <DropdownMenuItem
                      onClick={() => !isSelf && setStatusUser(user)}
                      disabled={isSelf}
                    >
                      <Power className="size-4 mr-2" />
                      {user.isActive ? 'Lock Account' : 'Activate Account'}
                    </DropdownMenuItem>
                  )}

                  {canAssignRoles && (
                    <DropdownMenuItem onClick={() => setRolesUser(user)}>
                      <ShieldCheck className="size-4 mr-2" /> Assign Roles
                    </DropdownMenuItem>
                  )}

                  {canCreate && !isSelf && (
                    <DropdownMenuItem onClick={() => setResetPasswordUser(user)}>
                      <KeyRound className="size-4 mr-2" /> Reset Password
                    </DropdownMenuItem>
                  )}

                  {canDelete && !isSelf && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteUser(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4 mr-2" /> Delete Account
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        size: 45,
        meta: {
          headerClassName: 'w-[45px] min-w-[40px] max-w-[50px] text-center',
          cellClassName: 'w-[45px] min-w-[40px] max-w-[50px] text-center',
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="size-6 rounded" />
            </div>
          ),
        },
      },
    ],
    [currentUserId, canUpdate, canAssignRoles, canCreate, canDelete],
  );

  const table = useReactTable({
    columns,
    data: items,
    pageCount: meta?.totalPages || -1,
    getRowId: (row) => String(row.id),
    state: {
      pagination,
      sorting,
    },
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const hasActiveFilters =
    debouncedSearch ||
    employmentStatusFilter !== 'all' ||
    isActiveFilter !== 'all' ||
    roleFilter !== 'all' ||
    unassignedOnly;

  if (showInitialSkeleton) {
    return <UserTableSkeleton />;
  }

  return (
    <DataGrid
      table={table}
      recordCount={meta?.total || 0}
      isLoading={isTableLoading}
      emptyMessage="No employees found"
      tableLayout={{
        cellBorder: true,
        rowBorder: true,
        headerBorder: true,
        headerBackground: true,
      }}
      tableClassNames={{
        headerRow:
          'font-bold text-foreground text-xs uppercase tracking-wider bg-muted',
      }}
    >
      <Card className="border border-border shadow-xs overflow-hidden">
        {/* Card Header with 2 balanced, full-width rows */}
        <div className="p-5 border-b border-border flex flex-col gap-3.5 bg-card w-full">
          {/* Row 1: Search (Left) and Main Actions (Right) */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              {isTableLoading || searchInputValue !== debouncedSearch ? (
                <Loader2 className="size-4 text-primary animate-spin absolute start-3 top-1/2 -translate-y-1/2" />
              ) : (
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              )}
              <Input
                placeholder="Search by name, username, email, code..."
                className="ps-9 h-9 text-xs bg-background w-full"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = searchInputValue.trim();
                    setDebouncedSearch(trimmed);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }
                }}
              />
              {searchInputValue.length > 0 && (
                <Button
                  mode="icon"
                  variant="ghost"
                  className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchInputValue('');
                    setDebouncedSearch('');
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 px-3"
                onClick={() => refetch()}
                disabled={isTableLoading}
                title="Refresh list"
              >
                <RefreshCw
                  className={`size-3.5 ${isTableLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>

              {canCreate && (
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 text-xs gap-1.5 px-3.5 font-semibold"
                  onClick={() => setCreateOpen(true)}
                  title="Add new employee"
                >
                  <UserPlus className="size-3.5" />
                  Add Employee
                </Button>
              )}
            </div>
          </div>

          {/* Row 2: Filter Controls (Left) and Total Counter (Right) */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Employment Status Filter */}
              <div className="w-36 sm:w-40">
                <Select
                  value={employmentStatusFilter}
                  onValueChange={(val) => {
                    setEmploymentStatusFilter(val);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="h-8.5 text-xs bg-background">
                    <SelectValue placeholder="Employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employment</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* IsActive Login Filter */}
              <div className="w-36 sm:w-40">
                <Select
                  value={isActiveFilter}
                  onValueChange={(val) => {
                    setIsActiveFilter(val);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="h-8.5 text-xs bg-background">
                    <SelectValue placeholder="Login access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Access</SelectItem>
                    <SelectItem value="active">Active (Allowed)</SelectItem>
                    <SelectItem value="inactive">Locked (Disabled)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter */}
              <div className="w-40 sm:w-44">
                <Select
                  value={roleFilter}
                  onValueChange={handleRoleChange}
                  disabled={unassignedOnly}
                >
                  <SelectTrigger className="h-8.5 text-xs bg-background">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {formatRoleName(r.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prominent Unassigned Toggle Button */}
              <Button
                type="button"
                variant={unassignedOnly ? 'primary' : 'outline'}
                size="sm"
                onClick={handleToggleUnassigned}
                className={`h-8.5 text-xs gap-1.5 transition-all ${
                  unassignedOnly
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 font-medium'
                    : 'text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                }`}
                title="Filter accounts with no roles assigned"
              >
                <AlertTriangle className="size-3.5" />
                Unassigned Roles
              </Button>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8.5 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
                >
                  <X className="size-3.5" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Total Record Counter Badge */}
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <span>Total:</span>
              <Badge variant="secondary" size="xs" className="font-semibold text-foreground">
                {meta?.total ?? items.length} employees
              </Badge>
            </div>
          </div>
        </div>

        {/* DataGrid Table */}
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>

        {/* Pagination Footer */}
        {meta && meta.total > 0 && (
          <CardFooter className="py-3 px-6 border-t border-border">
            <DataGridPagination sizes={[10, 20, 50, 100]} />
          </CardFooter>
        )}
      </Card>

      {/* Dialog Modals */}
      <UserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          refetch();
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
      />

      <UserEditDialog
        user={editUser}
        open={Boolean(editUser)}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSuccess={() => refetch()}
      />

      <UserStatusDialog
        user={statusUser}
        open={Boolean(statusUser)}
        onOpenChange={(open) => !open && setStatusUser(null)}
        onSuccess={() => refetch()}
        isSelf={statusUser?.id === currentUserId}
      />

      <UserRolesDialog
        user={rolesUser}
        open={Boolean(rolesUser)}
        onOpenChange={(open) => !open && setRolesUser(null)}
        onSuccess={() => refetch()}
      />

      <UserResetPasswordDialog
        user={resetPasswordUser}
        open={Boolean(resetPasswordUser)}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
        onSuccess={() => refetch()}
        isSelf={resetPasswordUser?.id === currentUserId}
      />

      <UserDeleteDialog
        user={deleteUser}
        open={Boolean(deleteUser)}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        onSuccess={() => refetch()}
        isSelf={deleteUser?.id === currentUserId}
      />

      <UserDetailsDialog
        user={detailsUser}
        open={Boolean(detailsUser)}
        onOpenChange={(open) => !open && setDetailsUser(null)}
        onEdit={() => {
          if (detailsUser) setEditUser(detailsUser);
        }}
        onToggleStatus={() => {
          if (detailsUser) setStatusUser(detailsUser);
        }}
        onAssignRoles={() => {
          if (detailsUser) setRolesUser(detailsUser);
        }}
        onResetPassword={() => {
          if (detailsUser) setResetPasswordUser(detailsUser);
        }}
        canUpdate={canUpdate}
        canAssignRoles={canAssignRoles}
        canCreate={canCreate}
        isSelf={detailsUser?.id === currentUserId}
      />
    </DataGrid>
  );
}
