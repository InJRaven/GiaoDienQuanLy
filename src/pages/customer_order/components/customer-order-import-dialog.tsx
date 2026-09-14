import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Lock,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatCurrencyVND,
  ImportConfirmResponse,
  ImportPreviewResponse,
} from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'result';

export function CustomerOrderImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(
    null,
  );
  const [confirmData, setConfirmData] = useState<ImportConfirmResponse | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'ready' | 'duplicate' | 'invalid'
  >('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setStep('upload');
      setPreviewData(null);
      setConfirmData(null);
      setFilterStatus('all');
      setIsUploading(false);
      setIsConfirming(false);
    }
  }, [open]);

  // Download Sample Template CSV (10 standard columns preserved!)
  const handleDownloadSample = () => {
    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel to display Vietnamese correctly
      'Tên khách,Mã môn,Tài khoản,Mật khẩu,Giá,Nhân viên,Hoàn thành,Chứng chỉ,Đã thanh toán,Ghi chú\n' +
      'Nguyễn Văn A,CS101,vana@gmail.com,MatKhau123,1500000,admin,x,,x,Khách VIP\n' +
      'Trần Thị B,ENG202,thib@gmail.com,Pass456,1200000,,,,,Cần hỗ trợ tuần sau\n' +
      'Nguyễn Văn A,DS301,vana@gmail.com,,1800000,,x,x,x,Môn thứ 2 cùng tài khoản\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_nhap_don_khach_le.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Đã tải file mẫu về máy.');
  };

  // Step 1: Upload File & Get Preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File vượt quá dung lượng tối đa 2 MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<ImportPreviewResponse>(
        '/coursera/customer-orders/import/preview',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      setPreviewData(res);
      setStep('preview');
      const newAccInfo =
        res.summary.newAccounts !== undefined
          ? `, ${res.summary.newAccounts} khách tạo mới`
          : '';
      toast.success(
        `Đã đọc ${res.summary.totalRows} dòng (${res.summary.ready} hợp lệ${newAccInfo})`,
      );
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message;

      if (code === 'IMPORT_EMPTY_FILE') {
        toast.error('File rỗng hoặc không có dòng dữ liệu nào.');
      } else if (code === 'IMPORT_UNREADABLE_FILE') {
        toast.error('File hỏng hoặc định dạng không đúng (.xlsx hoặc .csv).');
      } else if (code === 'IMPORT_MISSING_COLUMNS') {
        toast.error(
          'File thiếu cột bắt buộc (cần có: Tên khách, Mã môn, Tài khoản).',
        );
      } else if (code === 'PAYLOAD_TOO_LARGE') {
        toast.error('File vượt quá kích thước 2 MB cho phép.');
      } else if (code === 'FORBIDDEN') {
        toast.error(
          'Bạn không có quyền tạo đơn hàng (customer_orders:create).',
        );
        onOpenChange(false);
      } else {
        toast.error(msg || 'Không thể đọc file import. Vui lòng kiểm tra lại.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Confirm Import with importId
  const handleConfirmImport = async () => {
    if (!previewData || !previewData.importId || isConfirming) return;

    setIsConfirming(true);

    try {
      const res = await api.post<ImportConfirmResponse>(
        '/coursera/customer-orders/import/confirm',
        { importId: previewData.importId },
      );

      setConfirmData(res);
      setStep('result');
      toast.success(`Đã tạo thành công ${res.created} đơn hàng.`);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message;

      if (code === 'IMPORT_EXPIRED') {
        toast.error(
          'Vé import đã hết hạn hoặc đã sử dụng. Vui lòng chọn file và thực hiện lại.',
        );
        // Reset back to upload step per requirement
        setStep('upload');
        setPreviewData(null);
      } else {
        toast.error(msg || 'Có lỗi xảy ra khi xác nhận tạo đơn hàng.');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (step === 'result') {
      onSuccess();
    }
    onOpenChange(false);
  };

  // Filter preview items by tab
  const filteredPreviewItems = useMemo(() => {
    if (!previewData) return [];
    if (filterStatus === 'all') return previewData.items;
    return previewData.items.filter((item) => item.status === filterStatus);
  }, [previewData, filterStatus]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="size-5 text-primary" />
            <span>Import Đơn hàng từ Excel / CSV</span>
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' &&
              'Bước 1: Chọn file Excel hoặc CSV (tối đa 2 MB, 1000 dòng).'}
            {step === 'preview' &&
              'Bước 2: Kiểm tra dữ liệu xem trước và phân tích tài khoản trước khi xác nhận tạo đơn.'}
            {step === 'result' && 'Bước 3: Kết quả thực hiện tạo đơn hàng.'}
          </DialogDescription>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-8">
              {/* Security Alert Banner */}
              <div className="w-full max-w-lg mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-foreground flex items-start gap-3">
                <ShieldAlert className="size-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
                    Bảo mật thông tin tài khoản khách hàng
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    File import có thể chứa mật khẩu Coursera của khách. Vui
                    lòng xoá file khỏi máy tính sau khi hoàn tất import, tuyệt
                    đối không gửi file qua các kênh chat công cộng.
                  </p>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg p-8 border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all text-center"
              >
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  {isUploading ? (
                    <Loader2 className="size-7 animate-spin" />
                  ) : (
                    <FileUp className="size-7" />
                  )}
                </div>
                <h4 className="font-semibold text-sm mb-1 text-foreground">
                  {isUploading
                    ? 'Đang phân tích dữ liệu file...'
                    : 'Nhấp để tải file lên'}
                </h4>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  Hỗ trợ định dạng <strong>.xlsx</strong> hoặc{' '}
                  <strong>.csv</strong>. Tối đa 2 MB và 1000 dòng.
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSample();
                    }}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Download className="size-3.5" />
                    Tải file mẫu (.csv)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUploading}
                    className="gap-1.5 text-xs h-8"
                  >
                    <FileUp className="size-3.5" />
                    Chọn file
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Validation */}
          {step === 'preview' && previewData && (
            <div className="flex flex-col gap-4">
              {/* Summary Cards (Section 4.2: Added newAccounts) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Tổng số dòng
                  </span>
                  <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
                    {previewData.summary.totalRows}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Hợp lệ (Tạo đơn)
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {previewData.summary.ready}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    Khách tạo mới
                  </span>
                  <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                    {previewData.summary.newAccounts ?? 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    Trùng lặp (Bỏ qua)
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {previewData.summary.duplicate}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
                  <span className="text-[11px] font-medium text-destructive uppercase tracking-wider block">
                    Lỗi dữ liệu
                  </span>
                  <span className="text-xl font-bold font-mono text-destructive mt-0.5 block">
                    {previewData.summary.invalid}
                  </span>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    Tất cả ({previewData.items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('ready')}
                    className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                      filterStatus === 'ready'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
                    }`}
                  >
                    Hợp lệ ({previewData.summary.ready})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('duplicate')}
                    className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                      filterStatus === 'duplicate'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
                    }`}
                  >
                    Trùng lặp ({previewData.summary.duplicate})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('invalid')}
                    className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                      filterStatus === 'invalid'
                        ? 'bg-destructive text-destructive-foreground font-semibold'
                        : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                    }`}
                  >
                    Lỗi ({previewData.summary.invalid})
                  </button>
                </div>

                <span className="text-[11px] text-muted-foreground italic">
                  Hiển thị {filteredPreviewItems.length} dòng
                </span>
              </div>

              {/* Preview Table with accountAction and warnings */}
              <div className="border border-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-muted z-10 border-b border-border">
                    <tr className="text-muted-foreground font-semibold">
                      <th className="py-2 px-3 w-12 text-center border-e border-border">
                        Dòng
                      </th>
                      <th className="py-2 px-3 border-e border-border min-w-[120px]">
                        Tên khách
                      </th>
                      <th className="py-2 px-3 border-e border-border min-w-16 text-center">
                        Mã môn
                      </th>
                      <th className="py-2 px-3 border-e border-border min-w-[130px]">
                        Tài khoản
                      </th>
                      <th className="py-2 px-2 border-e border-border w-14 text-center">
                        Pass
                      </th>
                      <th className="py-2 px-2.5 border-e border-border min-w-24 text-center">
                        Tài khoản
                      </th>
                      <th className="py-2 px-3 border-e border-border min-w-20 text-right">
                        Giá
                      </th>
                      <th className="py-2 px-3 border-e border-border min-w-20">
                        Phụ trách
                      </th>
                      <th className="py-2 px-3 min-w-[150px]">
                        Trạng thái / Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPreviewItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-6 text-center text-muted-foreground italic"
                        >
                          Không có dòng nào thuộc bộ lọc này.
                        </td>
                      </tr>
                    ) : (
                      filteredPreviewItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-muted/30 transition-colors ${
                            item.status === 'invalid'
                              ? 'bg-destructive/5'
                              : item.status === 'duplicate'
                                ? 'bg-amber-500/5'
                                : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center border-e border-border font-mono text-[11px] text-muted-foreground">
                            {item.rowNumber}
                          </td>
                          <td className="py-2 px-3 border-e border-border font-medium text-foreground truncate max-w-[130px]">
                            {item.customerName}
                          </td>
                          <td className="py-2 px-3 border-e border-border font-mono text-xs text-primary font-semibold text-center">
                            {item.courseCode}
                          </td>
                          <td className="py-2 px-3 border-e border-border font-mono text-xs truncate max-w-[140px]">
                            {item.courseraAccount}
                          </td>
                          <td className="py-2 px-2 border-e border-border text-center">
                            {item.hasPassword ? (
                              <span
                                className="inline-flex items-center text-muted-foreground justify-center"
                                title="Đã có mật khẩu"
                              >
                                <Lock className="size-3 text-primary" />
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>

                          {/* Section 4.1: accountAction Column */}
                          <td className="py-2 px-2.5 border-e border-border text-center">
                            {item.accountAction === 'create' && (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 font-normal"
                              >
                                Tạo mới
                              </Badge>
                            )}
                            {item.accountAction === 'reuse' && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] py-0 px-1.5 font-normal"
                              >
                                Dùng lại
                              </Badge>
                            )}
                            {item.accountAction === 'fill-password' && (
                              <Badge
                                variant="secondary"
                                className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] py-0 px-1.5 font-normal"
                              >
                                Điền pass
                              </Badge>
                            )}
                            {!item.accountAction && (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-3 border-e border-border text-right font-mono text-xs">
                            {item.price ? formatCurrencyVND(item.price) : '0 ₫'}
                          </td>
                          <td className="py-2 px-3 border-e border-border text-muted-foreground text-xs font-mono truncate max-w-20">
                            {item.assignee || '—'}
                          </td>
                          <td className="py-2 px-3">
                            <div className="space-y-1">
                              {item.status === 'ready' && (
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5"
                                >
                                  Hợp lệ
                                </Badge>
                              )}
                              {item.status === 'duplicate' && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] py-0 px-1.5"
                                  title="Đã có đơn trước đó cho môn này"
                                >
                                  Trùng lặp
                                </Badge>
                              )}
                              {item.status === 'invalid' && (
                                <div className="space-y-0.5">
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] py-0 px-1.5"
                                  >
                                    Lỗi
                                  </Badge>
                                  {item.errors && item.errors.length > 0 && (
                                    <p className="text-[10px] text-destructive leading-tight">
                                      {item.errors.join(', ')}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Section 4.2: Warnings rendered in yellow (non-blocking) */}
                              {item.warnings && item.warnings.length > 0 && (
                                <div className="flex items-start gap-1 p-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] leading-tight">
                                  <AlertTriangle className="size-3 shrink-0 text-amber-600 mt-0.5" />
                                  <span>{item.warnings.join('; ')}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Result Breakdown (Section 4.3: Added accountsCreated) */}
          {step === 'result' && confirmData && (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Đơn tạo thành công
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                      {confirmData.created} đơn
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                  <UserCheck className="size-8 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Khách tạo mới
                    </span>
                    <span className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
                      {confirmData.accountsCreated ?? 0} khách
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                  {confirmData.failed > 0 ? (
                    <XCircle className="size-8 text-destructive shrink-0" />
                  ) : (
                    <Check className="size-8 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                      Thất bại
                    </span>
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {confirmData.failed} đơn
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-muted z-10 border-b border-border">
                    <tr className="text-muted-foreground font-semibold">
                      <th className="py-2 px-3 w-16 text-center border-e border-border">
                        Dòng file
                      </th>
                      <th className="py-2 px-3 border-e border-border">
                        Tên khách
                      </th>
                      <th className="py-2 px-3 border-e border-border w-28 text-center">
                        Mã đơn ID
                      </th>
                      <th className="py-2 px-3">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {confirmData.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="py-2 px-3 text-center border-e border-border font-mono text-xs text-muted-foreground">
                          {it.rowNumber}
                        </td>
                        <td className="py-2 px-3 border-e border-border font-medium text-foreground">
                          {it.customerName}
                        </td>
                        <td className="py-2 px-3 border-e border-border text-center font-mono text-xs font-semibold text-primary">
                          {it.id ? `#${it.id}` : '—'}
                        </td>
                        <td className="py-2 px-3">
                          {it.status === 'created' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                              <Check className="size-3" /> Thành công
                            </span>
                          ) : (
                            <span className="text-destructive font-medium text-[11px]">
                              {it.error || 'Lỗi không xác định'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-border flex items-center justify-between gap-2 bg-muted/10">
          {step === 'upload' && (
            <div className="flex w-full justify-end">
              <Button variant="outline" onClick={handleClose}>
                Đóng
              </Button>
            </div>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setPreviewData(null);
                }}
                disabled={isConfirming}
              >
                Chọn file khác
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={
                  isConfirming ||
                  !previewData ||
                  previewData.summary.ready === 0
                }
                className="gap-1.5"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang tạo đơn...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>
                      Tạo {previewData ? previewData.summary.ready : 0} đơn
                    </span>
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'result' && (
            <div className="flex w-full justify-end">
              <Button onClick={handleClose} className="gap-1.5">
                <Check className="size-4" />
                <span>Hoàn tất & Làm mới danh sách</span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
