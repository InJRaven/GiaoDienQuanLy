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
import {
  Plus,
  RefreshCw,
  Upload,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useApiQuery } from '@/hooks/use-api-query';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectListResponse, SubjectItem } from '../types';
import { SubjectImportDialog } from './subject-import-dialog';
import { SubjectCreateDialog } from './subject-create-dialog';
import { SubjectEditDialog } from './subject-edit-dialog';
import { SubjectDeleteDialog } from './subject-delete-dialog';
import { SubjectToggleDialog } from './subject-toggle-dialog';
import { SubjectDetailsDialog } from './subject-details-dialog';
import { SubjectTableSkeleton } from './subject-table-skeleton';
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

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

function LinkRowItem({ url }: { url: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    onCopy: () => toast.success('Link copied to clipboard'),
  });

  return (
    <div className="group flex items-center justify-between gap-2 py-1 px-2.5 rounded-md bg-muted/40 hover:bg-muted/70 border border-border/50 text-xs font-mono transition-colors w-full">
      <span
        className="truncate select-all text-foreground font-normal leading-relaxed grow"
        title={url}
      >
        {url}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(url);
          }}
          className="size-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all cursor-pointer"
          title="Copy link"
        >
          {isCopied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="size-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-background/80 transition-all cursor-pointer"
          title="Open in new tab"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

export function SubjectTable() {
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<SubjectItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<SubjectItem | null>(null);
  const [toggleItem, setToggleItem] = useState<SubjectItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<SubjectItem | null>(null);

  // Tanstack Table States
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'course_code', desc: false },
  ]);

  // Search State
  const [searchInputValue, setSearchInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce logic for search
  useEffect(() => {
    const timer = setTimeout(() => {
      const search = searchInputValue.trim();
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Build query params for the backend API
  const queryParams: Record<string, any> = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  };

  if (debouncedSearch) {
    queryParams.search = debouncedSearch;
  }

  if (sorting.length > 0) {
    queryParams.sortBy = sorting[0].id;
    queryParams.order = sorting[0].desc ? 'desc' : 'asc';
  } else {
    queryParams.sortBy = 'course_code';
    queryParams.order = 'asc';
  }

  const { data, isLoading, refetch, isFetching } =
    useApiQuery<SubjectListResponse>(['subjects', queryParams], '/coursera/subjects', {
      params: queryParams,
      placeholderData: keepPreviousData,
    });

  const items = data?.items || [];
  const meta = data?.meta;

  const headerClass = 'font-bold text-foreground text-xs uppercase tracking-wider';

  const columns = useMemo<ColumnDef<SubjectItem>[]>(
    () => [
      {
        id: 'course_code',
        accessorFn: (row) => row.code,
        header: ({ column }) => (
          <DataGridColumnHeader title="Code" column={column} className={headerClass} />
        ),
        cell: ({ row }) => (
          <span
            className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer select-none whitespace-nowrap block"
            onClick={() => setDetailsItem(row.original)}
            title="Click to view details"
          >
            {row.original.code}
          </span>
        ),
        enableSorting: true,
        size: 90,
        meta: {
          headerClassName: 'w-[90px] min-w-[85px] max-w-[110px]',
          cellClassName: 'w-[90px] min-w-[85px] max-w-[110px]',
          skeleton: <Skeleton className="h-4 w-16 rounded" />,
        },
      },
      {
        id: 'links',
        accessorFn: (row) => row.links,
        header: ({ column }) => (
          <DataGridColumnHeader title="Links" column={column} className={headerClass} />
        ),
        cell: (info) => {
          const links = (info.getValue() as any[]) || [];
          if (links.length === 0) {
            return (
              <span className="text-xs text-muted-foreground/50 italic">
                No links attached
              </span>
            );
          }

          return (
            <div className="flex flex-col gap-1 py-0.5 w-full">
              {links.map((link, idx) => (
                <LinkRowItem key={idx} url={link.url} />
              ))}
            </div>
          );
        },
        enableSorting: false,
        size: 700,
        meta: {
          headerClassName: 'w-auto min-w-[350px]',
          cellClassName: 'w-auto min-w-[350px]',
          skeleton: (
            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-md bg-muted/30 border border-border/40 w-full max-w-md">
              <Skeleton className="h-3.5 w-4/5 rounded" />
              <div className="flex gap-1.5 shrink-0">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="size-4 rounded" />
              </div>
            </div>
          ),
        },
      },
      {
        id: 'isActive',
        accessorFn: (row) => row.isActive,
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} className={headerClass} />
        ),
        cell: (info) => {
          const active = Boolean(info.getValue());
          return active ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
              Inactive
            </span>
          );
        },
        enableSorting: false,
        size: 85,
        meta: {
          headerClassName: 'w-[85px] min-w-[80px] max-w-[95px]',
          cellClassName: 'w-[85px] min-w-[80px] max-w-[95px]',
          skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
        },
      },
      {
        id: 'created_at',
        accessorFn: (row) => row.createdAt,
        header: ({ column }) => (
          <DataGridColumnHeader title="Created At" column={column} className={headerClass} />
        ),
        cell: (info) => (
          <span className="text-xs text-muted-foreground font-medium font-mono whitespace-nowrap">
            {formatDate(info.getValue() as string)}
          </span>
        ),
        enableSorting: true,
        size: 105,
        meta: {
          headerClassName: 'w-[105px] min-w-[95px] max-w-[115px]',
          cellClassName: 'w-[105px] min-w-[95px] max-w-[115px]',
          skeleton: <Skeleton className="h-4 w-20 rounded" />,
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
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
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditItem(row.original)}>
                  <Edit className="size-4 mr-2" /> Edit Links
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setToggleItem(row.original)}>
                  {row.original.isActive ? (
                    <EyeOff className="size-4 mr-2" />
                  ) : (
                    <Eye className="size-4 mr-2" />
                  )}
                  {row.original.isActive ? 'Hide Subject' : 'Show Subject'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteItem(row.original)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" /> Delete Permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
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
    [],
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

  const Toolbar = () => (
    <CardToolbar className="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => setImportOpen(true)}
        title="Import subjects via JSON"
      >
        <Upload className="size-3.5" />
        Import
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => refetch()}
        disabled={isFetching}
        title="Refresh subject list"
      >
        <RefreshCw
          className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`}
        />
        Refresh
      </Button>
      <Button
        variant="primary"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => setCreateOpen(true)}
        title="Create new subject"
      >
        <Plus className="size-3.5" />
        Create
      </Button>
    </CardToolbar>
  );

  if (isLoading && !data) {
    return <SubjectTableSkeleton />;
  }

  return (
    <DataGrid
      table={table}
      recordCount={meta?.total || 0}
      isLoading={isLoading || isFetching}
      tableLayout={{
        cellBorder: true,
        rowBorder: true,
        headerBorder: true,
        headerBackground: true,
      }}
      tableClassNames={{
        headerRow: 'font-bold text-foreground text-xs uppercase tracking-wider bg-muted',
      }}
    >
      <Card className="border border-border shadow-xs">
        <CardHeader className="py-4 px-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by course code..."
              className="ps-9 h-8 text-xs"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
            {searchInputValue.length > 0 && (
              <Button
                mode="icon"
                variant="ghost"
                className="absolute end-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchInputValue('')}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
          <Toolbar />
        </CardHeader>

        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>

        {meta && meta.total > 0 && (
          <CardFooter className="py-3 px-6 border-t border-border">
            <DataGridPagination />
          </CardFooter>
        )}
      </Card>

      <SubjectImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => {
          refetch();
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
      />
      <SubjectCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          refetch();
          setPagination((p) => ({ ...p, pageIndex: 0 }));
        }}
      />
      <SubjectEditDialog
        item={editItem}
        open={Boolean(editItem)}
        onOpenChange={(open) => !open && setEditItem(null)}
        onSuccess={() => refetch()}
      />
      <SubjectDeleteDialog
        item={deleteItem}
        open={Boolean(deleteItem)}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onSuccess={() => refetch()}
      />
      <SubjectToggleDialog
        item={toggleItem}
        open={Boolean(toggleItem)}
        onOpenChange={(open) => !open && setToggleItem(null)}
        onSuccess={() => refetch()}
      />
      <SubjectDetailsDialog
        item={detailsItem}
        open={Boolean(detailsItem)}
        onOpenChange={(open) => !open && setDetailsItem(null)}
      />
    </DataGrid>
  );
}
