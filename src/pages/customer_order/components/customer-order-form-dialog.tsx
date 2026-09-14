import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import {
  AlertCircle,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Save,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { useApiQuery } from '@/hooks/use-api-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AssigneeOption,
  CreateCustomerOrderDto,
  CustomerOrderItem,
  formatCurrencyVND,
  SubjectOption,
  UpdateCustomerOrderDto,
} from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: CustomerOrderItem | null; // null = Create Mode, object = Edit Mode
  onSuccess: (savedOrder?: CustomerOrderItem) => void;
}

export function CustomerOrderFormDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: Props) {
  const isEditMode = Boolean(order);
  const { can, isAdmin } = useAuth();
  const canViewUsers = can('users:view') || isAdmin;

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [courseraAccount, setCourseraAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordAction, setPasswordAction] = useState<
    'keep' | 'change' | 'delete'
  >('keep');
  const [priceInput, setPriceInput] = useState<string>('0');
  const [assignedUserId, setAssignedUserId] = useState<string>('none');
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [note, setNote] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch subjects for course dropdown
  const { data: subjectsData } = useApiQuery<
    { items?: SubjectOption[] } | SubjectOption[]
  >(['coursera', 'subjects', 'options'], '/coursera/subjects?limit=100', {
    staleTime: 10 * 60 * 1000,
    enabled: open,
  });

  const subjects: SubjectOption[] = Array.isArray(subjectsData)
    ? subjectsData
    : (subjectsData as any)?.items || [];

  // Fetch users for assignee dropdown (only if user has permission)
  const { data: usersData } = useApiQuery<
    { items?: AssigneeOption[] } | AssigneeOption[]
  >(['users', 'assignee-options'], '/users?limit=100', {
    staleTime: 10 * 60 * 1000,
    enabled: open && canViewUsers,
  });

  const assignees: AssigneeOption[] = Array.isArray(usersData)
    ? usersData
    : (usersData as any)?.items || [];

  // Populate or reset form values when opening
  useEffect(() => {
    if (open) {
      setFieldErrors({});
      setErrorMsg('');
      setShowPassword(false);

      if (order) {
        // Edit Mode
        setCustomerName(order.customerName || '');
        setCourseId(order.courseId ? String(order.courseId) : '');
        setCourseraAccount(order.courseraAccount || '');
        setPassword('');
        setPasswordAction('keep');
        // Convert string price to raw integer string without trailing zeros for input
        const rawPrice = order.price
          ? String(Math.round(Number(order.price)))
          : '0';
        setPriceInput(rawPrice);
        setAssignedUserId(
          order.assignedUserId ? String(order.assignedUserId) : 'none',
        );
        setIsCompleted(order.isCompleted || false);
        setHasCertificate(order.hasCertificate || false);
        setIsPaid(order.isPaid || false);
        setNote(order.note || '');
      } else {
        // Create Mode
        setCustomerName('');
        setCourseId('');
        setCourseraAccount('');
        setPassword('');
        setPasswordAction('change');
        setPriceInput('0');
        setAssignedUserId('none');
        setIsCompleted(false);
        setHasCertificate(false);
        setIsPaid(false);
        setNote('');
      }
    }
  }, [open, order]);

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Tên khách hàng là bắt buộc';
    } else if (customerName.trim().length > 150) {
      errors.customerName = 'Tên khách hàng không quá 150 ký tự';
    }

    if (!courseId) {
      errors.courseId = 'Vui lòng chọn môn học';
    }

    if (!courseraAccount.trim()) {
      errors.courseraAccount = 'Tài khoản Coursera là bắt buộc';
    } else if (courseraAccount.trim().length > 255) {
      errors.courseraAccount = 'Tài khoản không quá 255 ký tự';
    }

    const numPrice = Number(priceInput);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.price = 'Giá tiền phải là số hợp lệ không âm';
    }

    if (
      !isEditMode &&
      passwordAction === 'change' &&
      password &&
      password.length > 255
    ) {
      errors.password = 'Mật khẩu không quá 255 ký tự';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const numPrice = Number(priceInput) || 0;
      const targetAssignedId =
        assignedUserId === 'none' ? null : Number(assignedUserId);

      if (!isEditMode) {
        // CREATE ORDER
        const payload: CreateCustomerOrderDto = {
          customerName: customerName.trim(),
          courseId: Number(courseId),
          courseraAccount: courseraAccount.trim(),
          price: numPrice,
          assignedUserId: targetAssignedId,
          isCompleted,
          hasCertificate,
          isPaid,
          note: note.trim() || undefined,
        };

        if (password.trim()) {
          payload.password = password.trim();
        }

        const res = await api.post<CustomerOrderItem>(
          '/coursera/customer-orders',
          payload,
        );
        toast.success(`Đã tạo đơn cho khách hàng "${res.customerName}"`);
        onSuccess(res);
        onOpenChange(false);
      } else if (order) {
        // UPDATE ORDER - Compute Dirty Fields Only
        const patchDto: UpdateCustomerOrderDto = {};

        if (customerName.trim() !== order.customerName) {
          patchDto.customerName = customerName.trim();
        }

        if (Number(courseId) !== order.courseId) {
          patchDto.courseId = Number(courseId);
        }

        if (courseraAccount.trim() !== order.courseraAccount) {
          patchDto.courseraAccount = courseraAccount.trim();
        }

        const originalNumPrice = order.price ? Number(order.price) : 0;
        if (numPrice !== originalNumPrice) {
          patchDto.price = numPrice;
        }

        if (targetAssignedId !== order.assignedUserId) {
          patchDto.assignedUserId = targetAssignedId; // null unassigns
        }

        if (isCompleted !== order.isCompleted) {
          patchDto.isCompleted = isCompleted;
        }

        if (hasCertificate !== order.hasCertificate) {
          patchDto.hasCertificate = hasCertificate;
        }

        if (isPaid !== order.isPaid) {
          patchDto.isPaid = isPaid;
        }

        const currentNote = note.trim() || null;
        if (currentNote !== (order.note || null)) {
          patchDto.note = currentNote || undefined;
        }

        // Handle password changes
        if (passwordAction === 'delete') {
          patchDto.password = null; // null deliberately deletes stored password
        } else if (passwordAction === 'change' && password.trim()) {
          patchDto.password = password.trim();
        }

        // Check if anything changed
        if (Object.keys(patchDto).length === 0) {
          toast.info('Không có thay đổi nào để lưu.');
          onOpenChange(false);
          return;
        }

        const res = await api.patch<CustomerOrderItem>(
          `/coursera/customer-orders/${order.id}`,
          patchDto,
        );
        toast.success(`Đã cập nhật đơn hàng #${order.id}`);
        onSuccess(res);
        onOpenChange(false);
      }
    } catch (err: any) {
      const serverCode = err?.response?.data?.code;
      const msg = err?.response?.data?.message;

      if (serverCode === 'RESOURCE_NOT_FOUND') {
        setErrorMsg('Đơn hàng hoặc môn học không tồn tại trong hệ thống.');
      } else if (serverCode === 'FOREIGN_KEY_VIOLATION') {
        setErrorMsg('Nhân viên phụ trách hoặc môn học không tồn tại.');
      } else {
        setErrorMsg(msg || 'Có lỗi xảy ra, vui lòng kiểm tra lại dữ liệu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {isEditMode ? (
              <>
                <BookOpen className="size-5 text-primary" />
                <span>Chỉnh sửa đơn hàng #{order?.id}</span>
              </>
            ) : (
              <>
                <Plus className="size-5 text-primary" />
                <span>Tạo đơn hàng khách lẻ mới</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Cập nhật thông tin chi tiết đơn hàng. Mọi thay đổi sẽ được lưu vào sổ sách hệ thống.'
              : 'Nhập thông tin đơn hàng mới. Môn học và tài khoản Coursera là các trường bắt buộc.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 py-2 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Row 1: Customer Name & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="customer-name"
                  className="text-xs font-semibold"
                >
                  Tên khách hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Nguyễn Văn A"
                  className={`h-9 text-xs ${
                    fieldErrors.customerName ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                  autoFocus={!isEditMode}
                />
                {fieldErrors.customerName && (
                  <span className="text-[11px] text-destructive">
                    {fieldErrors.customerName}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="course-select"
                  className="text-xs font-semibold"
                >
                  Môn học <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={courseId}
                  onValueChange={setCourseId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="course-select"
                    className={`h-9 text-xs ${
                      fieldErrors.courseId ? 'border-destructive' : ''
                    }`}
                  >
                    <SelectValue placeholder="Chọn môn học (mã môn)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {subjects.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        Đang tải danh sách môn...
                      </div>
                    ) : (
                      subjects.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <span className="font-mono font-medium">
                            {s.code}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {fieldErrors.courseId && (
                  <span className="text-[11px] text-destructive">
                    {fieldErrors.courseId}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Coursera Account & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="coursera-account"
                  className="text-xs font-semibold"
                >
                  Tài khoản Coursera (Email/User){' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coursera-account"
                  value={courseraAccount}
                  onChange={(e) => setCourseraAccount(e.target.value)}
                  placeholder="e.g. vana@gmail.com"
                  className={`font-mono h-9 text-xs ${
                    fieldErrors.courseraAccount ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {fieldErrors.courseraAccount && (
                  <span className="text-[11px] text-destructive">
                    {fieldErrors.courseraAccount}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="order-price"
                    className="text-xs font-semibold"
                  >
                    Giá tiền (VNĐ)
                  </Label>
                  <span className="text-[11px] font-mono text-primary font-semibold">
                    {formatCurrencyVND(priceInput)}
                  </span>
                </div>
                <Input
                  id="order-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="1500000"
                  className="font-mono h-9 text-xs"
                  disabled={isSubmitting}
                />
                {fieldErrors.price && (
                  <span className="text-[11px] text-destructive">
                    {fieldErrors.price}
                  </span>
                )}
              </div>
            </div>

            {/* Row 3: Password Handling */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="size-3.5 text-primary" />
                  Mật khẩu tài khoản Coursera (Tuỳ chọn)
                </Label>
                {isEditMode && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPasswordAction('keep')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        passwordAction === 'keep'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      Giữ nguyên
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordAction('change')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        passwordAction === 'change'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      Đổi mới
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordAction('delete')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        passwordAction === 'delete'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      Xoá mật khẩu
                    </button>
                  </div>
                )}
              </div>

              {(!isEditMode || passwordAction === 'change') && (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu tài khoản khách..."
                      className="font-mono h-9 text-xs pe-10"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Mật khẩu sẽ được mã hoá hai chiều an toàn trên máy chủ.
                  </p>
                </div>
              )}

              {isEditMode && passwordAction === 'keep' && (
                <p className="text-[11px] text-muted-foreground italic">
                  Mật khẩu hiện tại được giữ nguyên, không thay đổi trên máy
                  chủ.
                </p>
              )}

              {isEditMode && passwordAction === 'delete' && (
                <p className="text-[11px] text-destructive font-medium">
                  Mật khẩu đã lưu sẽ bị xoá vĩnh viễn khỏi hệ thống khi lưu.
                </p>
              )}
            </div>

            {/* Row 4: Assignee (Only shown if user has users:view) */}
            {canViewUsers && (
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="assigned-user"
                  className="text-xs font-semibold flex items-center gap-1.5"
                >
                  <User className="size-3.5 text-primary" />
                  Nhân viên phụ trách
                </Label>
                <Select
                  value={assignedUserId}
                  onValueChange={setAssignedUserId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="assigned-user" className="h-9 text-xs">
                    <SelectValue placeholder="Chọn nhân viên phụ trách" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">
                      <span className="text-muted-foreground italic">
                        Chưa phân công (Unassigned)
                      </span>
                    </SelectItem>
                    {assignees.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        <span className="font-medium">
                          {u.fullName
                            ? `${u.fullName} (${u.username})`
                            : u.username}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Row 5: Three Independent Status Switches */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                Trạng thái tiến độ (Độc lập)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Completed Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">
                      Học xong
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      isCompleted
                    </span>
                  </div>
                  <Switch
                    checked={isCompleted}
                    onCheckedChange={setIsCompleted}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Certificate Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">
                      Chứng chỉ
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      hasCertificate
                    </span>
                  </div>
                  <Switch
                    checked={hasCertificate}
                    onCheckedChange={setHasCertificate}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Paid Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">
                      Thanh toán
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      isPaid
                    </span>
                  </div>
                  <Switch
                    checked={isPaid}
                    onCheckedChange={setIsPaid}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Note */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-note" className="text-xs font-semibold">
                Ghi chú nội bộ
              </Label>
              <Textarea
                id="order-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú về khách hàng, yêu cầu đặc biệt..."
                className="text-xs min-h-[70px] resize-none"
                disabled={isSubmitting}
              />
            </div>
          </DialogBody>

          <DialogFooter className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : isEditMode ? (
                <>
                  <Save className="size-4" />
                  <span>Lưu thay đổi</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Tạo đơn hàng</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
