import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  X,
  Phone,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { useMinDelay } from '@/hooks/use-min-delay';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useApiQuery } from '@/hooks/use-api-query';
import { useAuth } from '@/auth/context/auth-context';
import {
  CollaboratorFilterParams,
  CollaboratorItem,
  CollaboratorListResponse,
} from '../types';
import { CollaboratorDialog } from './collaborator-dialog';
import { CollaboratorTableSkeleton } from './collaborator-table-skeleton';

interface Props {
  canManage?: boolean;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function CollaboratorTable({ canManage: canManageProp }: Props) {
  const { can, isAdmin, hasRole } = useAuth();
  const canManage =
    canManageProp ??
    (can('collaborators:manage') || hasRole('admin') || isAdmin);

  // Pagination & Sorting State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Spec 2.2: Do not send hardcoded sort by default, backend sorts full_name asc
  const [sorting, setSorting] = useState<SortingState>([]);

  // Search input with 350ms debounce (modelled after UserTable)
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorItem | null>(null);

  const handleResetFilters = () => {
    setSearchInputValue('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  // Build query params
  const queryParams = useMemo(() => {
    const params: CollaboratorFilterParams = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (statusFilter === 'active') {
      params.isActive = true;
    } else if (statusFilter === 'inactive') {
      params.isActive = false;
    }

    // Spec 2.2: Do NOT hardcode default sortBy. Only send when explicitly sorted.
    if (sorting.length > 0) {
      const sortField = sorting[0].id;
      if (sortField === 'full_name' || sortField === 'fullName') {
        params.sortBy = 'full_name';
      } else if (sortField === 'created_at' || sortField === 'createdAt') {
        params.sortBy = 'created_at';
      } else if (sortField === 'updated_at' || sortField === 'updatedAt') {
        params.sortBy = 'updated_at';
      }
      params.order = sorting[0].desc ? 'desc' : 'asc';
    }

    return params;
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, statusFilter, sorting]);

  // Fetch API
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useApiQuery<CollaboratorListResponse>(
    ['collaborators', queryParams],
    '/collaborators',
    {
      params: queryParams,
      placeholderData: keepPreviousData,
      staleTime: 0,
    },
  );

  // Minimum duration skeleton handling (initial load: 800ms, search/filter: 650ms)
  const { showInitialSkeleton, isTableLoading } = useMinDelay({
    isLoading,
    isFetching,
    hasData: !!data,
    triggerKey: queryParams,
    options: {
      initialDelay: 800, // 0.8s: satisfies requested 0.5s - 1s for initial skeleton load
      subsequentDelay: 650, // 0.65s: satisfies requested >= 0.5s for search/filter skeleton load
    },
  });

  const items = data?.items || [];
  const meta = data?.meta;

  const handleCreate = () => {
    setSelectedCollaborator(null);
    setDialogOpen(true);
  };

  const handleEdit = (collab: CollaboratorItem) => {
    setSelectedCollaborator(collab);
    setDialogOpen(true);
  };

  const headerClass =
    'font-bold text-foreground text-xs uppercase tracking-wider select-none';

  // Columns configuration modelled after UserTable
  const columns = useMemo<ColumnDef<CollaboratorItem>[]>(
    () => [
      {
        id: 'full_name',
        accessorFn: (row) => row.fullName,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Cộng tác viên"
            column={column}
            className={headerClass}
          />
        ),
        cell: ({ row }) => {
          const collab = row.original;
          return (
            <div className="flex items-center gap-2.5 py-1">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {collab.fullName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  onClick={() => canManage && handleEdit(collab)}
                  className={`font-semibold text-xs text-foreground truncate ${
                    canManage
                      ? 'hover:text-primary transition-colors cursor-pointer'
                      : ''
                  }`}
                  title={collab.fullName}
                >
                  {collab.fullName}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  ID: #{collab.id}
                </span>
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 220,
        meta: {
          headerClassName: 'min-w-[200px]',
          cellClassName: 'min-w-[200px]',
          skeleton: (
            <div className="flex items-center gap-2.5 py-1">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <div className="flex flex-col gap-1 min-w-0">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
            </div>
          ),
        },
      },
      {
        id: 'phone',
        accessorFn: (row) => row.phone,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Số điện thoại"
            column={column}
            className={headerClass}
            visibility={false}
          />
        ),
        cell: ({ row }) => {
          const phone = row.original.phone;
          return phone ? (
            <div className="flex items-center gap-1.5 py-1">
              <Phone className="size-3 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs text-foreground">{phone}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/50 text-xs italic">—</span>
          );
        },
        enableSorting: false,
        size: 150,
        meta: {
          headerClassName: 'min-w-[150px]',
          cellClassName: 'min-w-[150px]',
          skeleton: (
            <div className="flex items-center gap-1.5 py-1">
              <Skeleton className="size-3 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-20 rounded" />
            </div>
          ),
        },
      },
      {
        id: 'note',
        accessorFn: (row) => row.note,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Ghi chú"
            column={column}
            className={headerClass}
            visibility={false}
          />
        ),
        cell: ({ row }) => {
          const note = row.original.note;
          return note ? (
            <span
              className="text-xs text-muted-foreground line-clamp-2 max-w-md py-1"
              title={note}
            >
              {note}
            </span>
          ) : (
            <span className="text-muted-foreground/50 text-xs italic">—</span>
          );
        },
        enableSorting: false,
        size: 240,
        meta: {
          headerClassName: 'min-w-[220px]',
          cellClassName: 'min-w-[220px]',
          skeleton: <Skeleton className="h-3.5 w-48 rounded" />,
        },
      },
      {
        id: 'isActive',
        header: () => (
          <span className="font-bold text-foreground text-xs uppercase tracking-wider select-none text-center block w-full">
            Trạng thái
          </span>
        ),
        cell: ({ row }) => {
          const active = row.original.isActive;
          return (
            <div className="flex justify-center">
              {active ? (
                <Badge
                  variant="success"
                  appearance="light"
                  size="sm"
                  className="gap-1 font-medium whitespace-nowrap text-[11px] px-2"
                >
                  <UserCheck className="size-3" />
                  Đang hợp tác
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="gap-1 text-muted-foreground bg-muted font-medium whitespace-nowrap text-[11px] px-2"
                >
                  <UserX className="size-3" />
                  Ngừng hợp tác
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
        size: 110,
        meta: {
          headerClassName: 'w-[110px] min-w-[105px] max-w-[115px] text-center',
          cellClassName: 'w-[110px] min-w-[105px] max-w-[115px] text-center',
          skeleton: <Skeleton className="h-5 w-20 rounded-full mx-auto" />,
        },
      },
      {
        id: 'created_at',
        accessorFn: (row) => row.createdAt,
        header: () => (
          <span className="font-bold text-foreground text-xs uppercase tracking-wider select-none text-center block w-full">
            Ngày tạo
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-full">
            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap text-center">
              {formatDate(row.original.createdAt)}
            </span>
          </div>
        ),
        enableSorting: false,
        size: 110,
        meta: {
          headerClassName: 'w-[110px] min-w-[105px] max-w-[115px] text-center',
          cellClassName: 'w-[110px] min-w-[105px] max-w-[115px] text-center',
          skeleton: <Skeleton className="h-4 w-16 rounded mx-auto" />,
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Thao tác</span>,
        cell: ({ row }) => {
          if (!canManage) {
            return (
              <span className="text-center block text-muted-foreground/40">
                —
              </span>
            );
          }
          return (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(row.original)}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                title="Chỉnh sửa thông tin"
              >
                <Edit className="size-3" />
                Sửa
              </Button>
            </div>
          );
        },
        enableSorting: false,
        size: 55,
        meta: {
          headerClassName: 'w-[55px] min-w-[50px] max-w-[60px] text-center',
          cellClassName: 'w-[55px] min-w-[50px] max-w-[60px] text-center',
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="h-7 w-10 rounded" />
            </div>
          ),
        },
      },
    ],
    [canManage],
  );

  // TanStack table instance modelled after UserTable
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

  const hasActiveFilters = Boolean(
    debouncedSearch || statusFilter !== 'all',
  );

  if (showInitialSkeleton) {
    return <CollaboratorTableSkeleton />;
  }

  return (
    <DataGrid
      table={table}
      recordCount={meta?.total || 0}
      isLoading={isTableLoading}
      emptyMessage="Không tìm thấy cộng tác viên nào"
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
        {/* Card Header: Search + Filter on the Left, Actions on the Right */}
        <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card w-full">
          {/* Left: Search Input + Status Filter + Clear Button */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              {isTableLoading || searchInputValue !== debouncedSearch ? (
                <Loader2 className="size-4 text-primary animate-spin absolute start-3 top-1/2 -translate-y-1/2" />
              ) : (
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              )}
              <Input
                placeholder="Tìm CTV theo họ tên hoặc SĐT..."
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

            {/* Status Filter */}
            <div className="w-44">
              <Select
                value={statusFilter}
                onValueChange={(val: any) => {
                  setStatusFilter(val);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Trạng thái hợp tác" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hợp tác</SelectItem>
                  <SelectItem value="inactive">Ngừng hợp tác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filter Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
              >
                <X className="size-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1.5 px-3"
              onClick={() => refetch()}
              disabled={isTableLoading}
              title="Làm mới danh sách"
            >
              <RefreshCw
                className={`size-3.5 ${isTableLoading ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>

            {canManage && (
              <Button
                variant="primary"
                size="sm"
                className="h-9 text-xs gap-1.5 px-3.5 font-semibold"
                onClick={handleCreate}
                title="Thêm cộng tác viên"
              >
                <Plus className="size-3.5" />
                Thêm cộng tác viên
              </Button>
            )}
          </div>
        </div>

        {/* DataGrid Table */}
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>

        {/* Pagination Footer identical to UserTable */}
        {meta && meta.total > 0 && (
          <CardFooter className="py-3 px-6 border-t border-border">
            <DataGridPagination sizes={[10, 20, 50, 100]} />
          </CardFooter>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <CollaboratorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collaborator={selectedCollaborator}
        onSuccess={() => refetch()}
      />
    </DataGrid>
  );
}
