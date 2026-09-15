import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { changePasswordSchema, ChangePasswordFormValues } from '../schemas';
import { profileService } from '../services/profile-service';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await profileService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      toast.success('Đổi mật khẩu thành công! Các thiết bị khác đã được đăng xuất.');
      form.reset();
      onOpenChange(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // STRICT ERROR SPECIFICATION
      if (status === 429) {
        setServerError('Bạn đã thao tác quá nhiều lần. Thử lại sau một phút.');
      } else if (status === 401) {
        setServerError('Mật khẩu hiện tại không đúng.');
      } else if (data?.message) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        setServerError(msg);
      } else {
        setServerError('Không thể đổi mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setServerError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5 text-primary" />
            Đổi mật khẩu
          </DialogTitle>
          <DialogDescription>
            Nhập mật khẩu hiện tại và mật khẩu mới để tăng cường bảo mật.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Alert BEFORE Submitting */}
        <Alert variant="warning" className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold text-xs">
            Lưu ý quan trọng
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
            Mọi phiên đăng nhập trên các thiết bị khác sẽ bị huỷ sau khi bạn đổi mật khẩu. Phiên hiện tại trên trình duyệt này vẫn được duy trì.
          </AlertDescription>
        </Alert>

        {serverError && (
          <Alert variant="destructive" className="py-2.5">
            <AlertDescription className="text-xs font-medium">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
              {...form.register('currentPassword')}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Mật khẩu mới (tối thiểu 12 ký tự)</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••••••"
              {...form.register('newPassword')}
            />
            {form.formState.errors.newPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Cập nhật mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
