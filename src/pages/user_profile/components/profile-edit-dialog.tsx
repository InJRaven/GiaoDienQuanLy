import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Info, Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/context/auth-context';
import {
  profileFormSchema,
  ProfileFormValues,
  sanitizeProfilePayload,
} from '../schemas';
import { profileService } from '../services/profile-service';
import { UserProfileResponse } from '../types';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfileResponse;
  isMyProfile: boolean;
  onSuccess: () => void;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  user,
  isMyProfile,
  onSuccess,
}: ProfileEditDialogProps) {
  const { can } = useAuth();
  const canEditAll = can('users:update');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const profile = user.profile;

  // Format initial date to YYYY-MM-DD
  const initialDob = profile?.dateOfBirth
    ? profile.dateOfBirth.split('T')[0]
    : '';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      phone: profile?.phone || '',
      avatarUrl: profile?.avatarUrl || '',
      dateOfBirth: initialDob,
      address: profile?.address || '',
      idCardNumber: profile?.idCardNumber || '',
      bankAccount: profile?.bankAccount || '',
      bankName: profile?.bankName || '',
    },
  });

  // Re-populate when dialog opens or user changes
  useEffect(() => {
    if (open) {
      form.reset({
        phone: user.profile?.phone || '',
        avatarUrl: user.profile?.avatarUrl || '',
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : '',
        address: user.profile?.address || '',
        idCardNumber: user.profile?.idCardNumber || '',
        bankAccount: user.profile?.bankAccount || '',
        bankName: user.profile?.bankName || '',
      });
      setServerError(null);
    }
  }, [open, user]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = sanitizeProfilePayload(values, canEditAll);

      // Route chosen strictly by whether caller has 'users:update' permission
      if (canEditAll) {
        await profileService.updateUserProfile(user.id, payload);
      } else {
        await profileService.updateMyProfile(payload);
      }

      toast.success('Cập nhật hồ sơ thành công!');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 400 && data?.message) {
        // Backend returns Vietnamese validation messages
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        setServerError(msg);
      } else if (status === 403) {
        setServerError('Bạn không có quyền thực hiện thao tác này.');
      } else {
        setServerError('Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserCog className="size-5 text-primary" />
            {isMyProfile ? 'Sửa thông tin cá nhân' : `Sửa hồ sơ: ${user.fullName || user.username}`}
          </DialogTitle>
          <DialogDescription>
            {isMyProfile
              ? 'Cập nhật thông tin liên hệ và chi tiết cá nhân của bạn.'
              : 'Quản trị viên cập nhật thông tin nhân sự và định danh.'}
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs font-medium">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Section: Editable in both modes */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="avatarUrl">Đường dẫn ảnh đại diện (URL)</Label>
              <Input
                id="avatarUrl"
                placeholder="https://example.com/avatar.jpg"
                {...form.register('avatarUrl')}
              />
              <p className="text-[11px] text-muted-foreground">
                Dán đường dẫn ảnh hợp lệ trực tiếp từ bên ngoài.
              </p>
              {form.formState.errors.avatarUrl && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.avatarUrl.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  placeholder="0912345678"
                  {...form.register('phone')}
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...form.register('dateOfBirth')}
                />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.dateOfBirth.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Địa chỉ thường trú / tạm trú</Label>
              <Textarea
                id="address"
                rows={2}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                {...form.register('address')}
              />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>
          </div>

          {/* Section: Sensitive fields (Editable if canEditAll, Read-only if lacking permission) */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Thông tin định danh & Ngân hàng
              </h4>
              {!canEditAll && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Info className="size-3" />
                  Chỉ đọc
                </span>
              )}
            </div>

            {!canEditAll && (
              <p className="text-[11px] text-muted-foreground italic">
                Liên hệ bộ phận nhân sự để thay đổi những thông tin này.
              </p>
            )}

            <div className="space-y-1">
              <Label htmlFor="idCardNumber">Số CMND / CCCD</Label>
              <Input
                id="idCardNumber"
                placeholder="001234567890"
                disabled={!canEditAll}
                className={!canEditAll ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}
                {...form.register('idCardNumber')}
              />
              {canEditAll && form.formState.errors.idCardNumber && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.idCardNumber.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bankAccount">Số tài khoản ngân hàng</Label>
                <Input
                  id="bankAccount"
                  placeholder="190012345678"
                  disabled={!canEditAll}
                  className={!canEditAll ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}
                  {...form.register('bankAccount')}
                />
                {canEditAll && form.formState.errors.bankAccount && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.bankAccount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="bankName">Tên ngân hàng</Label>
                <Input
                  id="bankName"
                  placeholder="Vietcombank, MB Bank..."
                  disabled={!canEditAll}
                  className={!canEditAll ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}
                  {...form.register('bankName')}
                />
                {canEditAll && form.formState.errors.bankName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.bankName.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
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
              disabled={isSubmitting || !form.formState.isDirty}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
