import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Loader2, UserCheck, UserPlus } from 'lucide-react';
import {
  CollaboratorItem,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from '../types';
import {
  createCollaboratorSchema,
  CreateCollaboratorFormValues,
} from '../schemas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: CollaboratorItem | null;
  onSuccess: () => void;
}

export function CollaboratorDialog({
  open,
  onOpenChange,
  collaborator,
  onSuccess,
}: Props) {
  const isEdit = Boolean(collaborator);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateCollaboratorFormValues>({
    resolver: zodResolver(createCollaboratorSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      note: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (open) {
      setServerError(null);
      if (collaborator) {
        reset({
          fullName: collaborator.fullName,
          phone: collaborator.phone || '',
          note: collaborator.note || '',
          isActive: collaborator.isActive,
        });
      } else {
        reset({
          fullName: '',
          phone: '',
          note: '',
          isActive: true,
        });
      }
    }
  }, [open, collaborator, reset]);

  const onSubmit = async (data: CreateCollaboratorFormValues) => {
    setServerError(null);
    try {
      if (isEdit && collaborator) {
        // Spec 2.4: compute dirty fields only
        const patchDto: UpdateCollaboratorDto = {};
        let hasChanges = false;

        if (data.fullName.trim() !== collaborator.fullName) {
          patchDto.fullName = data.fullName.trim();
          hasChanges = true;
        }

        const trimmedPhone = data.phone ? data.phone.trim() : null;
        const origPhone = collaborator.phone || null;
        if (trimmedPhone !== origPhone) {
          patchDto.phone = trimmedPhone; // null clears phone
          hasChanges = true;
        }

        const trimmedNote = data.note ? data.note.trim() : null;
        const origNote = collaborator.note || null;
        if (trimmedNote !== origNote) {
          patchDto.note = trimmedNote; // null clears note
          hasChanges = true;
        }

        if (data.isActive !== collaborator.isActive) {
          patchDto.isActive = data.isActive;
          hasChanges = true;
        }

        if (!hasChanges) {
          toast.info('Không có thay đổi nào để cập nhật');
          onOpenChange(false);
          return;
        }

        await api.patch(`/collaborators/${collaborator.id}`, patchDto);
        toast.success(`Đã cập nhật cộng tác viên "${data.fullName.trim()}"`);
      } else {
        // Spec 2.3: create collaborator
        const createDto: CreateCollaboratorDto = {
          fullName: data.fullName.trim(),
          ...(data.phone?.trim() ? { phone: data.phone.trim() } : {}),
          ...(data.note?.trim() ? { note: data.note.trim() } : {}),
          isActive: data.isActive,
        };

        await api.post('/collaborators', createDto);
        toast.success(`Đã thêm cộng tác viên "${data.fullName.trim()}"`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message;

      // Spec 2.3: 409 DUPLICATE_RESOURCE
      if (status === 409 || code === 'DUPLICATE_RESOURCE') {
        setServerError(
          'Đã có cộng tác viên tên này. Nếu là người khác, thêm chi tiết để phân biệt — ví dụ "Nguyễn Văn A (Hà Nội)".',
        );
      } else if (code === 'COLLABORATOR_NOTHING_TO_UPDATE') {
        setServerError('Không có trường nào được thay đổi để cập nhật.');
      } else if (status === 404 || code === 'RESOURCE_NOT_FOUND') {
        setServerError('Không tìm thấy cộng tác viên.');
      } else {
        setServerError(msg || 'Đã có lỗi xảy ra khi lưu cộng tác viên.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <UserCheck className="size-5 text-primary" />
            ) : (
              <UserPlus className="size-5 text-primary" />
            )}
            {isEdit ? 'Sửa thông tin cộng tác viên' : 'Thêm cộng tác viên mới'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Chỉnh sửa thông tin liên hệ và trạng thái hợp tác của cộng tác viên.'
              : 'Tạo hồ sơ cộng tác viên để ghi nhận đơn hàng và tính hoa hồng đối tác.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4 py-2">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register('fullName')}
                placeholder="VD: Nguyễn Văn A (Hà Nội)"
                className={`h-9 text-xs ${
                  errors.fullName
                    ? 'border-destructive focus-visible:ring-destructive/30'
                    : ''
                }`}
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <span className="text-[11px] text-destructive">
                  {errors.fullName.message}
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Số điện thoại</Label>
              <Input
                {...register('phone')}
                placeholder="09... hoặc +84..."
                className={`h-9 text-xs font-mono ${
                  errors.phone
                    ? 'border-destructive focus-visible:ring-destructive/30'
                    : ''
                }`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <span className="text-[11px] text-destructive">
                  {errors.phone.message}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                Định dạng chuẩn 9-11 chữ số sau đầu số 0 hoặc +84 (tùy chọn).
              </span>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Ghi chú đối tác</Label>
              <textarea
                {...register('note')}
                rows={3}
                placeholder="VD: Giới thiệu khách khu vực Hà Nội, kênh Zalo..."
                className={`w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.note ? 'border-destructive' : ''
                }`}
                disabled={isSubmitting}
              />
              {errors.note && (
                <span className="text-[11px] text-destructive">
                  {errors.note.message}
                </span>
              )}
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  Trạng thái hợp tác
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {isActive
                    ? 'Đang hợp tác (cho phép chọn gán vào đơn hàng mới)'
                    : 'Ngừng hợp tác (ẩn khỏi danh sách chọn khi tạo đơn mới)'}
                </span>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(val) => setValue('isActive', val, { shouldDirty: true })}
                disabled={isSubmitting}
              />
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (isEdit && !isDirty)}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo cộng tác viên'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
