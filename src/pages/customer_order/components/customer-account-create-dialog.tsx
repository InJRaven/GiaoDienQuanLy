import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Plus, User } from 'lucide-react';
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
import { CourseraAccount, CreateCustomerAccountDto } from '../types';
import {
  createCustomerAccountSchema,
  CreateCustomerAccountFormValues,
} from '../schemas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (acc: CourseraAccount) => void;
}

export function CustomerAccountCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerAccountFormValues>({
    resolver: zodResolver(createCustomerAccountSchema),
    defaultValues: {
      customerName: '',
      courseraAccount: '',
      password: '',
      note: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        customerName: '',
        courseraAccount: '',
        password: '',
        note: '',
      });
      setShowPassword(false);
      setErrorMsg('');
    }
  }, [open, reset]);

  const onSubmit = async (values: CreateCustomerAccountFormValues) => {
    setErrorMsg('');
    try {
      const payload: CreateCustomerAccountDto = {
        customerName: values.customerName.trim(),
        courseraAccount: values.courseraAccount.trim(),
        password: values.password?.trim() || undefined,
        note: values.note?.trim() || undefined,
      };

      const res = await api.post<CourseraAccount>(
        '/coursera/customer-accounts',
        payload,
      );
      toast.success(`Đã tạo tài khoản cho khách "${res.customerName}"`);
      onSuccess(res);
      onOpenChange(false);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message;

      if (code === 'DUPLICATE_RESOURCE') {
        setErrorMsg('Tài khoản Coursera này đã tồn tại trong hệ thống.');
      } else {
        setErrorMsg(msg || 'Có lỗi xảy ra khi tạo tài khoản.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Plus className="size-5 text-primary" />
            <span>Thêm tài khoản Coursera mới</span>
          </DialogTitle>
          <DialogDescription>
            Tạo thông tin khách hàng và tài khoản học tập Coursera dùng chung cho nhiều môn học.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4 py-2 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-acc-name" className="text-xs font-semibold">
                  Tên khách hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-acc-name"
                  {...register('customerName')}
                  placeholder="e.g. Nguyễn Văn A"
                  className={`h-9 text-xs ${
                    errors.customerName ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                />
                {errors.customerName && (
                  <span className="text-[11px] text-destructive">
                    {errors.customerName.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-acc-email" className="text-xs font-semibold">
                  Tài khoản Coursera (Email) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-acc-email"
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-acc-pwd" className="text-xs font-semibold flex items-center gap-1.5">
                <Lock className="size-3.5 text-muted-foreground" />
                Mật khẩu Coursera (Tuỳ chọn)
              </Label>
              <div className="relative">
                <Input
                  id="create-acc-pwd"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Nhập mật khẩu nếu có..."
                  className={`font-mono h-9 text-xs pr-9 ${
                    errors.password ? 'border-destructive' : ''
                  }`}
                  disabled={isSubmitting}
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-acc-note" className="text-xs font-semibold">
                Ghi chú
              </Label>
              <Textarea
                id="create-acc-note"
                {...register('note')}
                placeholder="Ghi chú về khách hàng..."
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
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Tạo tài khoản</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
