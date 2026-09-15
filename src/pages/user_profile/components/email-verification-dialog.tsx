import { useEffect, useState } from 'react';
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
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { verifyEmailSchema, VerifyEmailFormValues } from '../schemas';
import { profileService } from '../services/profile-service';

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  onSuccess,
}: EmailVerificationDialogProps) {
  const [step, setStep] = useState<'initial' | 'code_sent' | 'no_email' | 'already_verified'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [serverMessage, setServerMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes in seconds

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  });

  // Countdown timer when code is sent
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (step === 'code_sent' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Request code when dialog opens
  useEffect(() => {
    if (open && step === 'initial') {
      handleRequestCode();
    }
  }, [open]);

  const handleRequestCode = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await profileService.requestEmailVerification();

      if (res.code === 'VERIFICATION_CODE_SENT') {
        setServerMessage(res.message);
        setCountdown((res.expiresInMinutes || 10) * 60);
        setStep('code_sent');
      } else if (res.code === 'EMAIL_ALREADY_VERIFIED') {
        setStep('already_verified');
        toast.success(res.message || 'Email của bạn đã được xác thực!');
        onSuccess();
      } else if (res.code === 'NO_EMAIL_ON_FILE') {
        setStep('no_email');
        setServerMessage(res.message || 'Tài khoản chưa có thông tin email. Vui lòng liên hệ quản trị viên.');
      } else {
        setServerMessage(res.message);
        setStep('code_sent');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setErrorMessage('Bạn đã thao tác quá nhiều lần. Thử lại sau một phút.');
      } else {
        setErrorMessage(
          err?.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại sau.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: VerifyEmailFormValues) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await profileService.verifyEmail(values.code);
      toast.success(res.message || 'Xác thực email thành công!');
      onSuccess();
      handleClose(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 429) {
        setErrorMessage('Bạn đã thao tác quá nhiều lần. Thử lại sau một phút.');
      } else if (code === 'VERIFICATION_ATTEMPTS_EXCEEDED') {
        setErrorMessage('Nhập sai quá số lần. Bấm Gửi lại để nhận mã mới.');
      } else if (status === 422 || code === 'INVALID_VERIFICATION_CODE') {
        setErrorMessage('Mã không đúng hoặc đã hết hạn. Bấm Gửi lại để nhận mã mới.');
      } else {
        setErrorMessage(
          err?.response?.data?.message || 'Mã không đúng hoặc đã hết hạn. Bấm Gửi lại.',
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('initial');
      setErrorMessage(null);
      form.reset();
    }
    onOpenChange(isOpen);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Mail className="size-5 text-primary" />
            Xác thực địa chỉ Email
          </DialogTitle>
          <DialogDescription>
            Xác nhận quyền sở hữu email công ty của bạn để nhận thông báo quan trọng.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang gửi mã xác thực...</p>
          </div>
        ) : step === 'no_email' ? (
          <div className="space-y-4 py-2">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle className="text-sm font-semibold">Chưa có email</AlertTitle>
              <AlertDescription className="text-xs">
                {serverMessage}
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Đóng</Button>
            </DialogFooter>
          </div>
        ) : step === 'already_verified' ? (
          <div className="space-y-4 py-4 text-center">
            <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Email của bạn đã được xác thực thành công!
            </p>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Đóng</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Server Message showing masked email */}
            <div className="bg-muted/60 p-3 rounded-lg border border-border/60 text-sm">
              <p className="text-foreground">{serverMessage}</p>
              {countdown > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Mã có hiệu lực trong: <span className="font-semibold text-primary">{formatCountdown(countdown)}</span>
                </p>
              ) : (
                <p className="text-xs text-destructive mt-1 font-medium">
                  Mã đã hết hạn. Vui lòng bấm gửi lại mã mới.
                </p>
              )}
            </div>

            {errorMessage && (
              <Alert variant="destructive" className="py-2.5">
                <AlertDescription className="text-xs font-medium">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Mã xác thực (6 chữ số)</Label>
                <Input
                  id="code"
                  maxLength={6}
                  placeholder="123456"
                  className="font-mono text-center tracking-widest text-lg h-11"
                  {...form.register('code')}
                />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRequestCode}
                  disabled={isLoading || isVerifying}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="size-3.5" />
                  Gửi lại mã mới
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose(false)}
                    disabled={isVerifying}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isVerifying || countdown <= 0}>
                    {isVerifying && <Loader2 className="size-4 animate-spin mr-2" />}
                    Xác nhận
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
