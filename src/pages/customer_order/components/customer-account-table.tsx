import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Clock,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { useApiQuery } from '@/hooks/use-api-query';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useDebounce } from '@/hooks/use-debounce';
import { useMinDelay } from '@/hooks/use-min-delay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CourseraAccount,
  CredentialCheckDto,
  CredentialStatus,
  CustomerAccountListResponse,
  CustomerAccountSortBy,
} from '../types';
import { CustomerAccountCreateDialog } from './customer-account-create-dialog';
import { CustomerAccountEditDialog } from './customer-account-edit-dialog';
import { CustomerOrderTableSkeleton } from './customer-order-table-skeleton';

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Account email cell with hover copy button
 */
function AccountEmailCell({ email }: { email: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    onCopy: () => toast.success('Đã sao chép tài khoản'),
  });

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs text-foreground group">
      <span className="truncate max-w-[190px]" title={email}>
        {email}
      </span>
      <button
        type="button"
        onClick={() => copyToClipboard(email)}
        className="opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shrink-0"
        title="Sao chép tài khoản"
      >
        {isCopied ? (
          <Check className="size-3 text-emerald-500" />
        ) : (
          <Copy className="size-3" />
        )}
      </button>
    </div>
  );
}

/**
 * Account Password Cell
 */
function AccountPasswordCell({ account }: { account: CourseraAccount }) {
  const [revealed, setRevealed] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    onCopy: () => toast.success('Đã sao chép mật khẩu'),
  });

  // 1. User lacks view_credential permission (key 'password' not in object)
  if (!('password' in account)) {
    if (account.hasPassword) {
      return (
        <span
          className="inline-flex items-center gap-1 text-muted-foreground text-[11px] font-medium"
          title="Đã có mật khẩu trong hệ thống"
        >
          <Lock className="size-3 text-primary/70" />
          <span>Có mật khẩu</span>
        </span>
      );
    }
    return (
      <span className="text-muted-foreground/60 italic text-[11px]">
        Chưa có
      </span>
    );
  }

  // 2. Decryption error
  if (account.password === null && account.passwordError) {
    return (
      <Badge
        variant="destructive"
        className="text-[10px] py-0 px-1.5 font-normal cursor-help"
        title="Không đọc được mật khẩu đã lưu, liên hệ quản trị"
      >
        Lỗi giải mã
      </Badge>
    );
  }

  // 3. No password
  if (!account.password || account.hasPassword === false) {
    return (
      <span className="text-muted-foreground/60 italic text-[11px]">
        Chưa có
      </span>
    );
  }

  // 4. Masked password
  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      <span className="select-all">
        {revealed ? account.password : '••••••••'}
      </span>
      <button
        type="button"
        onClick={() => setRevealed(!revealed)}
        className="size-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        title={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
      <button
        type="button"
        onClick={() => copyToClipboard(account.password || '')}
        className="size-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        title="Sao chép mật khẩu"
      >
        {isCopied ? (
          <Check className="size-3 text-emerald-500" />
        ) : (
          <Copy className="size-3" />
        )}
      </button>
    </div>
  );
}

interface Props {
  onViewOrders: (accountId: number) => void;
}

export function CustomerAccountTable({ onViewOrders }: Props) {
  const { can, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const canCreate = can('customer_orders:create') || isAdmin;
  const canUpdate = can('customer_orders:update') || isAdmin;

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<CourseraAccount | null>(null);

  // Quick check loading tracking by accountId
  const [checkingId, setCheckingId] = useState<number | null>(null);

  // Pagination & Sorting state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);

  // Search input with 350ms debounce
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim(), 350);

  // Filter states
  const [credentialStatusFilter, setCredentialStatusFilter] =
    useState<string>('all');
  const [hasPasswordFilter, setHasPasswordFilter] = useState<string>('all');

  // Reset pageIndex on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, credentialStatusFilter, hasPasswordFilter]);

  // Construct query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (sorting.length > 0) {
      const field = sorting[0].id;
      const validSortMap: Record<string, CustomerAccountSortBy> = {
        customer_name: 'customer_name',
        customerName: 'customer_name',
        coursera_account: 'coursera_account',
        courseraAccount: 'coursera_account',
        created_at: 'created_at',
        createdAt: 'created_at',
        updated_at: 'updated_at',
        updatedAt: 'updated_at',
        credential_checked_at: 'credential_checked_at',
        credentialCheckedAt: 'credential_checked_at',
      };
      if (validSortMap[field]) {
        params.sortBy = validSortMap[field];
        params.order = sorting[0].desc ? 'desc' : 'asc';
      }
    } else {
      params.sortBy = 'created_at';
      params.order = 'desc';
    }

    if (credentialStatusFilter !== 'all') {
      params.credentialStatus = credentialStatusFilter as CredentialStatus;
    }

    if (hasPasswordFilter !== 'all') {
      params.hasPassword = hasPasswordFilter === 'true';
    }

    return params;
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    sorting,
    credentialStatusFilter,
    hasPasswordFilter,
  ]);

  // Fetch accounts query
  const { data, isLoading, isFetching, refetch } =
    useApiQuery<CustomerAccountListResponse>(
      ['coursera', 'customer-accounts', queryParams],
      '/coursera/customer-accounts',
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
      initialDelay: 800,
      subsequentDelay: 650,
    },
  });

  const items = data?.items || [];
  const totalCount = data?.pagination?.total || 0;
  const pageCount = data?.pagination?.totalPages || 1;

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    credentialStatusFilter !== 'all' ||
    hasPasswordFilter !== 'all';

  const handleResetFilters = () => {
    setSearchInput('');
    setCredentialStatusFilter('all');
    setHasPasswordFilter('all');
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  // Section 3.5: Handle Credential Check (ok / invalid)
  const handleCredentialCheck = async (
    account: CourseraAccount,
    status: 'ok' | 'invalid',
  ) => {
    if (!account.hasPassword) {
      toast.error('Tài khoản chưa có mật khẩu, không thể đánh dấu kiểm tra.');
      return;
    }

    setCheckingId(account.id);
    try {
      const payload: CredentialCheckDto = { status };
      await api.post(
        `/coursera/customer-accounts/${account.id}/credential-check`,
        payload,
      );
      toast.success(
        status === 'ok'
          ? `Đã đánh dấu Đăng nhập OK cho tài khoản "${account.customerName}"`
          : `Đã đánh dấu Mật khẩu sai cho tài khoản "${account.customerName}"`,
      );
      // Invalidate both accounts and orders cache
      queryClient.invalidateQueries({
        queryKey: ['coursera', 'customer-accounts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['coursera', 'customer-orders'],
      });
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'ACCOUNT_HAS_NO_PASSWORD') {
        toast.error('Tài khoản chưa có mật khẩu trong hệ thống.');
      } else {
        toast.error(
          err?.response?.data?.message || 'Không thể lưu trạng thái kiểm tra.',
        );
      }
    } finally {
      setCheckingId(null);
    }
  };

  // Define Columns
  const columns = useMemo<ColumnDef<CourseraAccount>[]>(() => {
    return [
      // 1. Sequential # Column
      {
        id: 'row_number',
        header: '#',
        size: 50,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground text-center block w-full">
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </span>
        ),
      },

      // 2. Customer Name (Sortable on accounts)
      {
        id: 'customer_name',
        accessorKey: 'customerName',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Khách hàng" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col min-w-[120px] max-w-[200px]">
            <span
              className="font-semibold text-xs text-foreground truncate"
              title={row.original.customerName}
            >
              {row.original.customerName}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ID #{row.original.id}
            </span>
          </div>
        ),
      },

      // 3. Coursera Account (Email - Sortable)
      {
        id: 'coursera_account',
        accessorKey: 'courseraAccount',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Tài khoản Coursera (Email)"
          />
        ),
        cell: ({ row }) => (
          <AccountEmailCell email={row.original.courseraAccount} />
        ),
      },

      // 4. Password (Secure Password Cell)
      {
        id: 'password',
        enableSorting: false,
        header: () => <span>Mật khẩu</span>,
        cell: ({ row }) => <AccountPasswordCell account={row.original} />,
      },

      // 5. Credential Status Chip
      {
        id: 'credential_status',
        accessorKey: 'credentialStatus',
        enableSorting: false,
        header: () => <span>Trạng thái kiểm tra</span>,
        cell: ({ row }) => {
          const acc = row.original;
          const status = acc.credentialStatus;

          return (
            <div className="flex flex-col gap-0.5">
              {status === 'ok' && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 gap-1 font-normal w-fit"
                >
                  <Check className="size-3" /> Đăng nhập OK
                </Badge>
              )}
              {status === 'invalid' && (
                <Badge
                  variant="destructive"
                  className="text-[10px] py-0 px-1.5 gap-1 font-normal w-fit"
                >
                  <AlertTriangle className="size-3" /> Mật khẩu sai
                </Badge>
              )}
              {status === 'unverified' && (
                <Badge
                  variant="outline"
                  className="text-muted-foreground text-[10px] py-0 px-1.5 font-normal w-fit"
                >
                  Chưa kiểm tra
                </Badge>
              )}

              {acc.credentialCheckedAt && (
                <span
                  className="text-[10px] text-muted-foreground/70 flex items-center gap-1 truncate max-w-40"
                  title={`Kiểm tra ngày ${formatDate(acc.credentialCheckedAt)} bởi ${acc.credentialCheckedByName || 'Nhân viên'}`}
                >
                  <Clock className="size-2.5 shrink-0" />
                  {formatDate(acc.credentialCheckedAt)}
                </span>
              )}
            </div>
          );
        },
      },

      // 6. Number of Orders + Button "Xem N đơn"
      {
        id: 'order_count',
        accessorKey: 'orderCount',
        enableSorting: false,
        header: () => (
          <span className="text-center block w-full">Số môn học</span>
        ),
        cell: ({ row }) => {
          const count = row.original.orderCount || 0;
          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewOrders(row.original.id)}
                className="h-7 text-xs px-2 gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
                title={`Xem danh sách các môn của ${row.original.customerName}`}
              >
                <BookOpen className="size-3 text-primary" />
                <span>
                  <strong>{count}</strong> môn
                </span>
              </Button>
            </div>
          );
        },
      },

      // 7. Note
      {
        id: 'note',
        accessorKey: 'note',
        enableSorting: false,
        header: () => <span>Ghi chú</span>,
        cell: ({ row }) =>
          row.original.note ? (
            <span
              className="text-xs text-foreground truncate max-w-40 block"
              title={row.original.note}
            >
              {row.original.note}
            </span>
          ) : (
            <span className="text-muted-foreground/40 text-xs italic">—</span>
          ),
      },

      // 8. Created At
      {
        id: 'created_at',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ngày tạo" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },

      // 9. Quick Actions: Credential Check buttons + Edit (Section 3.3 & 3.5)
      {
        id: 'actions',
        enableSorting: false,
        header: () => (
          <span className="text-center block w-full">Thao tác</span>
        ),
        cell: ({ row }) => {
          const acc = row.original;
          const isChecking = checkingId === acc.id;
          const hasPwd = acc.hasPassword;

          return (
            <div className="flex items-center justify-center gap-1.5">
              {/* Quick Check Button: OK */}
              {canUpdate && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasPwd || isChecking}
                    onClick={() => handleCredentialCheck(acc, 'ok')}
                    className="h-7 px-2 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-40"
                    title={
                      !hasPwd
                        ? 'Chưa có mật khẩu để kiểm tra'
                        : 'Vừa thử đăng nhập được (Đánh dấu OK)'
                    }
                  >
                    <Check className="size-3" />
                    <span>OK</span>
                  </Button>

                  {/* Quick Check Button: Invalid */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasPwd || isChecking}
                    onClick={() => handleCredentialCheck(acc, 'invalid')}
                    className="h-7 px-2 text-[11px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    title={
                      !hasPwd
                        ? 'Chưa có mật khẩu để kiểm tra'
                        : 'Mật khẩu sai, cần liên hệ khách hàng'
                    }
                  >
                    <AlertTriangle className="size-3" />
                    <span>Sai pass</span>
                  </Button>

                  {/* Edit Account Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditAccount(acc)}
                    title="Chỉnh sửa thông tin tài khoản & mật khẩu"
                  >
                    <Edit className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ];
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    canUpdate,
    checkingId,
    onViewOrders,
  ]);

  // TanStack Table Instance
  const table = useReactTable({
    data: items,
    columns,
    state: {
      pagination,
      sorting,
    },
    pageCount,
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Đã làm mới danh sách tài khoản.');
  };

  if (showInitialSkeleton) {
    return <CustomerOrderTableSkeleton />;
  }

  return (
    <>
      <Card className="border border-border shadow-xs">
        {/* Card Header Toolbar & Filters */}
        <CardHeader className="py-4 px-5 border-b border-border flex flex-col gap-3">
          {/* Top Row: Search & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            {/* Search Input (350ms debounce) */}
            <div className="relative w-full sm:w-80">
              {isTableLoading || searchInput !== debouncedSearch ? (
                <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              )}
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }
                }}
                placeholder="Tìm theo tên khách hoặc email..."
                className="h-9 pl-9 pr-8 text-xs bg-background"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <CardToolbar className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {canCreate && (
                <Button
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="h-9 gap-1.5 text-xs"
                >
                  <Plus className="size-4" />
                  <span>Thêm tài khoản</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isTableLoading}
                className="h-9 px-2.5 text-xs"
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  className={`size-3.5 ${isTableLoading ? 'animate-spin' : ''}`}
                />
              </Button>
            </CardToolbar>
          </div>

          {/* Bottom Row: Multi-Filter Selects */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Credential Status Filter */}
            <Select
              value={credentialStatusFilter}
              onValueChange={setCredentialStatusFilter}
            >
              <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
                <SelectValue placeholder="Đăng nhập: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Đăng nhập: Tất cả</SelectItem>
                <SelectItem value="ok">Đăng nhập OK</SelectItem>
                <SelectItem value="invalid">Mật khẩu sai</SelectItem>
                <SelectItem value="unverified">Chưa kiểm tra</SelectItem>
              </SelectContent>
            </Select>

            {/* Section 3.6: Prominent Quick Filter for Stalled Accounts (Mật khẩu sai / Cần gọi khách) */}
            <Button
              type="button"
              variant={
                credentialStatusFilter === 'invalid' ? 'destructive' : 'outline'
              }
              size="sm"
              onClick={() =>
                setCredentialStatusFilter((prev) =>
                  prev === 'invalid' ? 'all' : 'invalid',
                )
              }
              className="h-8 text-xs px-2.5 gap-1.5 font-medium"
            >
              <AlertTriangle className="size-3.5" />
              <span>Tài khoản kẹt mật khẩu (cần gọi khách)</span>
            </Button>

            {/* Has Password Filter */}
            <Select
              value={hasPasswordFilter}
              onValueChange={setHasPasswordFilter}
            >
              <SelectTrigger className="h-8 text-xs w-[145px] bg-background">
                <SelectValue placeholder="Mật khẩu: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mật khẩu: Tất cả</SelectItem>
                <SelectItem value="true">Đã có mật khẩu</SelectItem>
                <SelectItem value="false">Chưa có mật khẩu</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="size-3 mr-1" />
                Đặt lại lọc
              </Button>
            )}

            <span className="ml-auto text-[11px] text-muted-foreground font-medium">
              Tìm thấy <strong className="text-foreground">{totalCount}</strong>{' '}
              tài khoản
            </span>
          </div>
        </CardHeader>

        {/* DataGrid Table */}
        <CardTable>
          <DataGrid
            table={table}
            recordCount={totalCount}
            isLoading={isTableLoading}
            emptyMessage="Không tìm thấy tài khoản nào"
          >
            <div className="w-full overflow-x-auto">
              <DataGridTable />
            </div>
            <CardFooter className="py-3 px-5 border-t border-border flex items-center justify-between">
              <DataGridPagination />
            </CardFooter>
          </DataGrid>
        </CardTable>
      </Card>

      {/* Create Account Dialog */}
      <CustomerAccountCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['coursera', 'customer-accounts'],
          });
        }}
      />

      {/* Edit Account Dialog */}
      <CustomerAccountEditDialog
        open={Boolean(editAccount)}
        onOpenChange={(open) => {
          if (!open) setEditAccount(null);
        }}
        account={editAccount}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['coursera', 'customer-accounts'],
          });
          queryClient.invalidateQueries({
            queryKey: ['coursera', 'customer-orders'],
          });
        }}
      />
    </>
  );
}
