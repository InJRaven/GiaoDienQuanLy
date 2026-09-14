import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { AlertTriangle, Eye, EyeOff, Loader2, Lock, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CourseraAccount, UpdateCustomerAccountDto } from '../types';
import {
  updateCustomerAccountSchema,
  UpdateCustomerAccountFormValues,
} from '../schemas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: CourseraAccount | null;
  onSuccess: () => void;
}

export function CustomerAccountEditDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const orderCount = account?.orderCount || 0;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCustomerAccountFormValues>({
    resolver: zodResolver(updateCustomerAccountSchema),
    defaultValues: {
      customerName: '',
      courseraAccount: '',
      passwordAction: 'keep',
      password: '',
      note: '',
    },
  });

  const watchedPasswordAction = watch('passwordAction');

  useEffect(() => {
    if (open && account) {
      reset({
        customerName: account.customerName || '',
        courseraAccount: account.courseraAccount || '',
        passwordAction: 'keep',
        password: '',
        note: account.note || '',
      });
      setShowPassword(false);
      setErrorMsg('');
    }
  }, [open, account, reset]);

  const onSubmit = async (values: UpdateCustomerAccountFormValues) => {
    if (!account) return;
    setErrorMsg('');

    try {
      const patchDto: UpdateCustomerAccountDto = {};

      if (values.customerName.trim() !== account.customerName) {
        patchDto.customerName = values.customerName.trim();
      }

      if (values.courseraAccount.trim() !== account.courseraAccount) {
        patchDto.courseraAccount = values.courseraAccount.trim();
      }

      const currentNote = values.note?.trim() || null;
      if (currentNote !== (account.note || null)) {
        patchDto.note = currentNote || undefined;
      }

      // Handle password per Section 3.4
      if (values.passwordAction === 'change' && values.password?.trim()) {
        patchDto.password = values.password.trim();
      } else if (values.passwordAction === 'delete') {
        patchDto.password = null; // null deletes stored password
      }

      if (Object.keys(patchDto).length === 0) {
        toast.info('Không có thay đổi nào để lưu.');
        onOpenChange(false);
        return;
      }

      await api.patch(`/coursera/customer-accounts/${account.id}`, patchDto);
      toast.success(
        values.passwordAction === 'change'
          ? `Đã cập nhật tài khoản và đổi mật khẩu cho ${orderCount} đơn hàng.`
          : 'Đã cập nhật thông tin tài khoản thành công.',
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message;

      if (code === 'ACCOUNT_NOTHING_TO_UPDATE') {
        toast.info('Không có trường nào để cập nhật.');
        onOpenChange(false);
      } else if (code === 'DUPLICATE_RESOURCE') {
        setErrorMsg('Email tài khoản này đã tồn tại trong hệ thống.');
      } else {
        setErrorMsg(msg || 'Có lỗi xảy ra khi cập nhật tài khoản.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <User className="size-5 text-primary" />
            <span>Chỉnh sửa tài khoản #{account?.id}</span>
          </DialogTitle>
          <DialogDescription>
            Cập nhật tên khách hàng, email và mật khẩu tài khoản Coursera. Mọi thay đổi sẽ áp dụng đồng bộ cho tất cả các môn đang học của khách.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4 py-2 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Row 1: Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-name" className="text-xs font-semibold">
                  Tên khách hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="acc-name"
                  {...register('customerName')}
                  placeholder="e.g. Nguyễn Văn A"
                  className={`h-9 text-xs ${
                    errors.customerName ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.customerName && (
                  <span className="text-[11px] text-destructive">
                    {errors.customerName.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-email" className="text-xs font-semibold">
                  Tài khoản Coursera (Email) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="acc-email"
                  {...register('courseraAccount')}
                  placeholder="e.g. vana@gmail.com"
                  className={`font-mono h-9 text-xs ${
                    errors.courseraAccount ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.courseraAccount && (
                  <span className="text-[11px] text-destructive">
                    {errors.courseraAccount.message}
                  </span>
                )}
              </div>
            </div>

            {/* Password Management with explicit Order Count warning */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="size-3.5 text-primary" />
                  Mật khẩu tài khoản
                </Label>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setValue('passwordAction', 'keep')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      watchedPasswordAction === 'keep'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    Giữ nguyên
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('passwordAction', 'change')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      watchedPasswordAction === 'change'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    Đổi mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('passwordAction', 'delete')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      watchedPasswordAction === 'delete'
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    Xoá mật khẩu
                  </button>
                </div>
              </div>

              {watchedPasswordAction === 'keep' && (
                <p className="text-[11px] text-muted-foreground italic">
                  Mật khẩu đang lưu được giữ nguyên. Trạng thái kiểm tra không đổi.
                </p>
              )}

              {watchedPasswordAction === 'change' && (
                <div className="space-y-2.5">
                  {/* Section 3.4 Mandatory Warning */}
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-700 dark:text-amber-300 text-xs">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        Cảnh báo đổi mật khẩu chung
                      </p>
                      <p className="text-[11px] mt-0.5 leading-relaxed">
                        Mật khẩu này đang dùng cho <strong>{orderCount} đơn hàng</strong>. Đổi sẽ áp dụng cho cả {orderCount} đơn của khách này.
                        Hệ thống sẽ tự động chuyển trạng thái kiểm tra về <em>Chưa kiểm tra</em>.
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Nhập mật khẩu mới cho tài khoản..."
                      className={`font-mono h-9 text-xs pr-9 ${
                        errors.password ? 'border-destructive' : ''
                      }`}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[11px] text-destructive">
                      {errors.password.message}
                    </span>
                  )}
                </div>
              )}

              {watchedPasswordAction === 'delete' && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Mật khẩu đã lưu sẽ bị xoá vĩnh viễn khỏi hệ thống cho cả <strong>{orderCount} đơn hàng</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acc-note" className="text-xs font-semibold">
                Ghi chú tài khoản
              </Label>
              <Textarea
                id="acc-note"
                {...register('note')}
                placeholder="Ghi chú về khách hàng, tài khoản..."
                className="text-xs min-h-[60px] resize-none"
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
              ) : (
                <>
                  <Save className="size-4" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
