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
  Award,
  Check,
  Copy,
  CreditCard,
  Edit,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  User,
  X,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AssigneeOption,
  CredentialStatus,
  CustomerOrderItem,
  CustomerOrderListResponse,
  CustomerOrderSortBy,
  formatCurrencyVND,
  SubjectOption,
} from '../types';
import { CustomerOrderFormDialog } from './customer-order-form-dialog';
import { CustomerOrderImportDialog } from './customer-order-import-dialog';
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
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Account cell with quick copy button on hover
 */
function AccountCell({ account }: { account: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    onCopy: () => toast.success('Đã sao chép tài khoản'),
  });

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs text-foreground group">
      <span className="truncate max-w-[170px]" title={account}>
        {account}
      </span>
      <button
        type="button"
        onClick={() => copyToClipboard(account)}
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
 * Secure Password cell handling:
 * 1. Missing key in order.account (no permission) -> check hasPassword
 * 2. Decryption error (passwordError: true)
 * 3. Empty / null / hasPassword: false
 * 4. Masked with toggle reveal and copy
 */
function PasswordCell({ order }: { order: CustomerOrderItem }) {
  const [revealed, setRevealed] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    onCopy: () => toast.success('Đã sao chép mật khẩu'),
  });

  const account = order.account;

  // 1. User lacks customer_orders:view_credential permission
  if (!account || !('password' in account)) {
    if (account?.hasPassword) {
      return (
        <span
          className="inline-flex items-center gap-1 text-muted-foreground text-[11px] font-medium"
          title="Đã có mật khẩu lưu trong hệ thống"
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

  // 2. Decryption error on server
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

  // 3. Empty password or hasPassword false
  if (!account.password || account.hasPassword === false) {
    return (
      <span className="text-muted-foreground/60 italic text-[11px]">
        Chưa có
      </span>
    );
  }

  // 4. Masked password with reveal & copy
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

/**
 * Note cell with quick in-place popover editor
 */
function NoteCell({
  order,
  canUpdate,
  onSaved,
}: {
  order: CustomerOrderItem;
  canUpdate: boolean;
  onSaved: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [noteText, setNoteText] = useState(order.note || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNoteText(order.note || '');
  }, [order.note, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/coursera/customer-orders/${order.id}`, {
        note: noteText.trim() || null,
      });
      toast.success(`Đã cập nhật ghi chú đơn #${order.id}`);
      setIsOpen(false);
      onSaved();
    } catch {
      toast.error('Không thể cập nhật ghi chú.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canUpdate) {
    return order.note ? (
      <span
        className="text-xs text-foreground truncate max-w-[170px] block"
        title={order.note}
      >
        {order.note}
      </span>
    ) : (
      <span className="text-muted-foreground/40 text-xs italic">—</span>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="flex items-center gap-1.5 py-1 px-2 rounded-md max-w-[180px] cursor-pointer hover:bg-muted/70 transition-colors group select-none"
          title={order.note || 'Bấm để thêm ghi chú nhanh'}
        >
          {order.note ? (
            <span className="truncate text-xs text-foreground font-normal">
              {order.note}
            </span>
          ) : (
            <span className="text-muted-foreground/50 text-[11px] italic">
              + Ghi chú...
            </span>
          )}
          <Edit3 className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity ml-auto" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-2.5" align="start">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Ghi chú đơn #{order.id}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
            {order.account?.customerName || order.customerName || 'Khách'}
          </span>
        </div>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Nhập ghi chú cho đơn hàng..."
          className="text-xs min-h-[70px] resize-none"
          autoFocus
        />
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setIsOpen(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs px-2.5 gap-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="size-3 animate-spin" />}
            Lưu
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface CustomerOrderTableProps {
  filterAccountId?: number | null;
  onClearAccountFilter?: () => void;
}

export function CustomerOrderTable({
  filterAccountId,
  onClearAccountFilter,
}: CustomerOrderTableProps) {
  const { can, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const canCreate = can('customer_orders:create') || isAdmin;
  const canUpdate = can('customer_orders:update') || isAdmin;
  const canViewUsers = can('users:view') || isAdmin;

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<CustomerOrderItem | null>(null);

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
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>('all');
  const [completedFilter, setCompletedFilter] = useState<string>('all');
  const [certificateFilter, setCertificateFilter] = useState<string>('all');
  const [paidFilter, setPaidFilter] = useState<string>('all');
  const [credentialStatusFilter, setCredentialStatusFilter] =
    useState<string>('all');

  // Reset pageIndex on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    debouncedSearch,
    courseFilter,
    assignedUserFilter,
    completedFilter,
    certificateFilter,
    paidFilter,
    credentialStatusFilter,
    filterAccountId,
  ]);

  // Fetch subjects for course filter dropdown
  const { data: subjectsData } = useApiQuery<
    { items?: SubjectOption[] } | SubjectOption[]
  >(['coursera', 'subjects', 'options'], '/coursera/subjects?limit=100', {
    staleTime: 10 * 60 * 1000,
  });
  const subjects: SubjectOption[] = Array.isArray(subjectsData)
    ? subjectsData
    : (subjectsData as any)?.items || [];

  // Fetch assignees for assignee filter dropdown
  const { data: usersData } = useApiQuery<
    { items?: AssigneeOption[] } | AssigneeOption[]
  >(['users', 'assignee-options'], '/users?limit=100', {
    staleTime: 10 * 60 * 1000,
    enabled: canViewUsers,
  });
  const assignees: AssigneeOption[] = Array.isArray(usersData)
    ? usersData
    : (usersData as any)?.items || [];

  // Construct query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    };

    // Filter by specific account if passed
    if (filterAccountId) {
      params.accountId = filterAccountId;
    }

    // Search query
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    // Sorting (ONLY price, created_at, updated_at allowed per Section 2.4)
    if (sorting.length > 0) {
      const field = sorting[0].id;
      const validSortMap: Record<string, CustomerOrderSortBy> = {
        price: 'price',
        created_at: 'created_at',
        createdAt: 'created_at',
        updated_at: 'updated_at',
        updatedAt: 'updated_at',
      };
      if (validSortMap[field]) {
        params.sortBy = validSortMap[field];
        params.order = sorting[0].desc ? 'desc' : 'asc';
      }
    } else {
      params.sortBy = 'created_at';
      params.order = 'desc';
    }

    // Filters
    if (courseFilter !== 'all') {
      params.courseId = Number(courseFilter);
    }
    if (assignedUserFilter !== 'all') {
      params.assignedUserId = Number(assignedUserFilter);
    }
    if (completedFilter !== 'all') {
      params.isCompleted = completedFilter === 'true';
    }
    if (certificateFilter !== 'all') {
      params.hasCertificate = certificateFilter === 'true';
    }
    if (paidFilter !== 'all') {
      params.isPaid = paidFilter === 'true';
    }
    if (credentialStatusFilter !== 'all') {
      params.credentialStatus = credentialStatusFilter as CredentialStatus;
    }

    return params;
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    filterAccountId,
    debouncedSearch,
    sorting,
    courseFilter,
    assignedUserFilter,
    completedFilter,
    certificateFilter,
    paidFilter,
    credentialStatusFilter,
  ]);

  // Main Data Query - Note: NO POLLING
  const { data, isLoading, isFetching, refetch } =
    useApiQuery<CustomerOrderListResponse>(
      ['coursera', 'customer-orders', queryParams],
      '/coursera/customer-orders',
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

  // Has active filters check
  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    courseFilter !== 'all' ||
    assignedUserFilter !== 'all' ||
    completedFilter !== 'all' ||
    certificateFilter !== 'all' ||
    paidFilter !== 'all' ||
    credentialStatusFilter !== 'all' ||
    Boolean(filterAccountId);

  const handleResetFilters = () => {
    setSearchInput('');
    setCourseFilter('all');
    setAssignedUserFilter('all');
    setCompletedFilter('all');
    setCertificateFilter('all');
    setPaidFilter('all');
    setCredentialStatusFilter('all');
    if (onClearAccountFilter) onClearAccountFilter();
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  // Define Columns
  const columns = useMemo<ColumnDef<CustomerOrderItem>[]>(() => {
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

      // 2. Customer Name (Read from order.account.customerName, no sorting on customer_name)
      {
        id: 'customer_name',
        enableSorting: false,
        header: () => <span>Khách hàng</span>,
        cell: ({ row }) => {
          const customerName =
            row.original.account?.customerName ||
            row.original.customerName ||
            '—';
          return (
            <div className="flex flex-col min-w-[120px] max-w-[200px]">
              <span
                className="font-semibold text-xs text-foreground truncate"
                title={customerName}
              >
                {customerName}
              </span>
              {row.original.account?.id && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  TK #{row.original.account.id}
                </span>
              )}
            </div>
          );
        },
      },

      // 3. Course Code (subject code badge)
      {
        id: 'course_code',
        accessorKey: 'courseCode',
        enableSorting: false,
        header: () => <span>Mã môn</span>,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="font-mono text-xs font-semibold py-0.5 px-2 bg-primary/10 text-primary border-primary/20"
          >
            {row.original.courseCode}
          </Badge>
        ),
      },

      // 4. Coursera Account with credential status chip
      {
        id: 'coursera_account',
        enableSorting: false,
        header: () => <span>Tài khoản Coursera</span>,
        cell: ({ row }) => {
          const account = row.original.account;
          const email =
            account?.courseraAccount || row.original.courseraAccount || '—';
          const status = account?.credentialStatus;

          return (
            <div className="flex flex-col gap-1">
              <AccountCell account={email} />
              {status && (
                <div className="flex items-center gap-1">
                  {status === 'ok' && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 gap-1 font-normal w-fit"
                      title={
                        account?.credentialCheckedByName
                          ? `Đăng nhập OK (bởi ${account.credentialCheckedByName})`
                          : 'Đăng nhập OK'
                      }
                    >
                      <Check className="size-2.5" /> OK
                    </Badge>
                  )}
                  {status === 'invalid' && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] py-0 px-1.5 gap-1 font-normal w-fit"
                      title="Mật khẩu sai, cần liên hệ khách hàng"
                    >
                      <AlertTriangle className="size-2.5" /> Sai pass
                    </Badge>
                  )}
                  {status === 'unverified' && (
                    <span className="text-[10px] text-muted-foreground/60 italic">
                      Chưa thử
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        },
      },

      // 5. Password (Secure Cell reading from order.account)
      {
        id: 'password',
        enableSorting: false,
        header: () => <span>Mật khẩu</span>,
        cell: ({ row }) => <PasswordCell order={row.original} />,
      },

      // 6. Price (Sortable & keeps string format)
      {
        id: 'price',
        accessorKey: 'price',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Giá tiền"
            className="justify-end text-right"
          />
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono font-semibold text-xs text-foreground">
            {formatCurrencyVND(row.original.price)}
          </div>
        ),
      },

      // 7. Assigned User
      {
        id: 'assigned_user',
        accessorKey: 'assignedUserName',
        enableSorting: false,
        header: () => <span>Phụ trách</span>,
        cell: ({ row }) =>
          row.original.assignedUserName ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                {row.original.assignedUserName.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium text-foreground truncate max-w-[120px]">
                {row.original.assignedUserName}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground/60 italic text-[11px]">
              Chưa giao
            </span>
          ),
      },

      // 8. Completed Checkbox/Badge
      {
        id: 'is_completed',
        accessorKey: 'isCompleted',
        enableSorting: false,
        header: () => (
          <span className="text-center block w-full">Học xong</span>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.isCompleted ? (
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 gap-1"
              >
                <Check className="size-3" /> Xong
              </Badge>
            ) : (
              <span className="text-muted-foreground/40 text-xs font-mono">
                —
              </span>
            )}
          </div>
        ),
      },

      // 9. Certificate Checkbox/Badge
      {
        id: 'has_certificate',
        accessorKey: 'hasCertificate',
        enableSorting: false,
        header: () => (
          <span className="text-center block w-full">Chứng chỉ</span>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.hasCertificate ? (
              <Badge
                variant="secondary"
                className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] py-0 px-1.5 gap-1"
              >
                <Award className="size-3" /> Có
              </Badge>
            ) : (
              <span className="text-muted-foreground/40 text-xs font-mono">
                —
              </span>
            )}
          </div>
        ),
      },

      // 10. Paid Checkbox/Badge
      {
        id: 'is_paid',
        accessorKey: 'isPaid',
        enableSorting: false,
        header: () => (
          <span className="text-center block w-full">Thanh toán</span>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.isPaid ? (
              <Badge
                variant="secondary"
                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] py-0 px-1.5 gap-1"
              >
                <CreditCard className="size-3" /> Đã thu
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-1.5"
              >
                Chưa
              </Badge>
            )}
          </div>
        ),
      },

      // 11. Note Column
      {
        id: 'note',
        accessorKey: 'note',
        enableSorting: false,
        header: () => <span>Ghi chú</span>,
        cell: ({ row }) => (
          <NoteCell
            order={row.original}
            canUpdate={canUpdate}
            onSaved={() => {
              queryClient.invalidateQueries({
                queryKey: ['coursera', 'customer-orders'],
              });
            }}
          />
        ),
      },

      // 12. Created At (Sortable)
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

      // 13. Actions (Edit only, NO DELETE!)
      {
        id: 'actions',
        size: 60,
        enableSorting: false,
        header: () => <span className="sr-only">Thao tác</span>,
        cell: ({ row }) =>
          canUpdate && (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setEditOrder(row.original)}
                title="Chỉnh sửa đơn hàng"
              >
                <Edit className="size-3.5" />
              </Button>
            </div>
          ),
      },
    ];
  }, [pagination.pageIndex, pagination.pageSize, canUpdate]);

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
    toast.success('Đã làm mới danh sách đơn hàng.');
  };

  if (showInitialSkeleton) {
    return <CustomerOrderTableSkeleton />;
  }

  return (
    <>
      {/* Active Account Filter Banner (If filtered by account) */}
      {filterAccountId && (
        <div className="flex items-center justify-between p-3 px-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary mb-3">
          <div className="flex items-center gap-2">
            <User className="size-4 shrink-0" />
            <span>
              Đang lọc danh sách các môn của tài khoản{' '}
              <strong className="font-semibold">#{filterAccountId}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAccountFilter}
            className="h-7 text-xs px-2.5 text-primary hover:bg-primary/20 gap-1"
          >
            <X className="size-3.5" />
            <span>Xem tất cả đơn</span>
          </Button>
        </div>
      )}

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
                    setDebouncedSearch(searchInput.trim());
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
                    setDebouncedSearch('');
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
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportOpen(true)}
                    className="h-9 gap-1.5 text-xs"
                  >
                    <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Import Excel</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="h-9 gap-1.5 text-xs"
                  >
                    <Plus className="size-4" />
                    <span>Tạo đơn mới</span>
                  </Button>
                </>
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
            {/* Course Filter */}
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                <SelectValue placeholder="Môn: Tất cả" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">Môn: Tất cả</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    <span className="font-mono">{s.code}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Credential Status Filter */}
            <Select
              value={credentialStatusFilter}
              onValueChange={setCredentialStatusFilter}
            >
              <SelectTrigger className="h-8 text-xs w-[145px] bg-background">
                <SelectValue placeholder="Đăng nhập: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Đăng nhập: Tất cả</SelectItem>
                <SelectItem value="ok">Đăng nhập OK</SelectItem>
                <SelectItem value="invalid">Mật khẩu sai (Kẹt)</SelectItem>
                <SelectItem value="unverified">Chưa kiểm tra</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Toggle Button for Stalled Orders (credentialStatus = invalid) */}
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
              <span>Đơn kẹt mật khẩu</span>
            </Button>

            {/* Assignee Filter (if canViewUsers) */}
            {canViewUsers && (
              <Select
                value={assignedUserFilter}
                onValueChange={setAssignedUserFilter}
              >
                <SelectTrigger className="h-8 text-xs w-36 bg-background">
                  <SelectValue placeholder="Phụ trách: Tất cả" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">Phụ trách: Tất cả</SelectItem>
                  {assignees.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.fullName || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Completed Filter */}
            <Select value={completedFilter} onValueChange={setCompletedFilter}>
              <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                <SelectValue placeholder="Tiến độ: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tiến độ: Tất cả</SelectItem>
                <SelectItem value="true">Đã học xong</SelectItem>
                <SelectItem value="false">Chưa học xong</SelectItem>
              </SelectContent>
            </Select>

            {/* Certificate Filter */}
            <Select
              value={certificateFilter}
              onValueChange={setCertificateFilter}
            >
              <SelectTrigger className="h-8 text-xs w-[135px] bg-background">
                <SelectValue placeholder="Chứng chỉ: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Chứng chỉ: Tất cả</SelectItem>
                <SelectItem value="true">Đã có chứng chỉ</SelectItem>
                <SelectItem value="false">Chưa có chứng chỉ</SelectItem>
              </SelectContent>
            </Select>

            {/* Paid Filter */}
            <Select value={paidFilter} onValueChange={setPaidFilter}>
              <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                <SelectValue placeholder="Thanh toán: Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Thanh toán: Tất cả</SelectItem>
                <SelectItem value="true">Đã thanh toán</SelectItem>
                <SelectItem value="false">Chưa thanh toán</SelectItem>
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
              đơn
            </span>
          </div>
        </CardHeader>

        {/* DataGrid Table */}
        <CardTable>
          <DataGrid
            table={table}
            recordCount={totalCount}
            isLoading={isTableLoading}
            emptyMessage="Không tìm thấy đơn hàng nào"
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

      {/* Create & Edit Dialog */}
      <CustomerOrderFormDialog
        open={createOpen || Boolean(editOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditOrder(null);
          }
        }}
        order={editOrder}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['coursera', 'customer-orders'],
          });
        }}
      />

      {/* 2-Step Import Dialog */}
      <CustomerOrderImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['coursera', 'customer-orders'],
          });
          queryClient.invalidateQueries({
            queryKey: ['coursera', 'customer-accounts'],
          });
        }}
      />
    </>
  );
}
