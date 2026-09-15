import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/context/auth-context';
import { authService } from '@/auth/services/auth-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScreenLoader } from '@/components/common/screen-loader';
import {
  changePasswordSchema,
  ChangePasswordFormValues,
  verifyEmailSchema,
  VerifyEmailFormValues,
} from '@/pages/user_profile/schemas';
import { toAbsoluteUrl } from '@/lib/helpers';

export function OnboardingPage() {
  const { profile, loading, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Email verification states
  const [emailStepState, setEmailStepState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailServerMessage, setEmailServerMessage] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes
  const [canResendAfter, setCanResendAfter] = useState<number>(60); // 60s cooldown for resend
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Password change states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Form for Email Verification
  const emailForm = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: '' },
  });

  // Form for Password Change
  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Countdown timer for code expiry and resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (emailStepState === 'sent') {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        setCanResendAfter((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [emailStepState]);

  // If user needs email verification, auto-trigger request code once
  useEffect(() => {
    if (profile && profile.emailVerified === false && emailStepState === 'idle') {
      void handleRequestEmailCode();
    }
  }, [profile, emailStepState]);

  // Request email verification code
  const handleRequestEmailCode = async () => {
    setEmailStepState('sending');
    setEmailError(null);

    try {
      const res = await authService.requestEmailVerification();
      setEmailServerMessage(res.message);
      setCountdown((res.expiresInMinutes || 10) * 60);
      setCanResendAfter(60);
      setEmailStepState('sent');
      toast.info('Mã xác thực đã được gửi tới email của bạn.');
    } catch (err: any) {
      setEmailStepState('error');
      const status = err?.response?.status;
      if (status === 429) {
        setEmailError('Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau một phút.');
      } else {
        setEmailError(
          err?.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.',
        );
      }
    }
  };

  // Submit email verification code
  const onVerifyEmailSubmit = async (values: VerifyEmailFormValues) => {
    setIsSubmittingCode(true);
    setEmailError(null);

    try {
      const res = await authService.verifyEmail(values.code);
      toast.success(res.message || 'Xác thực email thành công!');
      // Sync fresh profile from GET /users/me
      await refreshProfile();
      emailForm.reset();
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 429) {
        setEmailError('Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau một phút.');
      } else if (code === 'VERIFICATION_ATTEMPTS_EXCEEDED') {
        setEmailError('Nhập sai quá số lần. Bấm "Gửi lại mã" để nhận mã mới.');
      } else if (status === 422 || code === 'INVALID_VERIFICATION_CODE') {
        setEmailError('Mã không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại.');
      } else {
        setEmailError(
          err?.response?.data?.message || 'Mã xác thực không hợp lệ. Vui lòng thử lại.',
        );
      }
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Submit password change
  const onChangePasswordSubmit = async (values: ChangePasswordFormValues) => {
    setIsSubmittingPassword(true);
    setPasswordError(null);

    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      toast.success('Đổi mật khẩu thành công!');
      passwordForm.reset();

      // STRICT RULE: Refetch GET /users/me to clear mustChangePassword flag
      await refreshProfile();

      // Navigate to dashboard
      navigate('/', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 429) {
        setPasswordError('Bạn đã thao tác quá nhiều lần. Thử lại sau một phút.');
      } else if (status === 401) {
        setPasswordError('Mật khẩu hiện tại không chính xác.');
      } else if (data?.message) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        setPasswordError(msg);
      } else {
        setPasswordError('Không thể đổi mật khẩu. Vui lòng kiểm tra lại.');
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle Logout (Constraint 3: Always escapable)
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/auth/signin', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/auth/signin', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Loading state during session restoration
  if (loading) {
    return <ScreenLoader />;
  }

  // Check which step needs to be performed
  const isEmailPending = profile?.emailVerified === false;
  const isPasswordPending = profile?.mustChangePassword === true;

  // If neither flag is active, user is fully onboarded -> Go to dashboard
  if (!isEmailPending && !isPasswordPending) {
    return <Navigate to="/" replace />;
  }

  const currentStep = isEmailPending ? 1 : 2;

  return (
    <div className="min-h-screen bg-muted/40 dark:bg-background flex flex-col justify-between">
      {/* Top Header with Brand & Logout */}
      <header className="w-full border-b bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-8 w-auto"
              alt="Logo"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">
                Hệ thống Quản lý
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Kích hoạt & Bảo mật tài khoản
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-foreground">
                {profile?.fullName || profile?.username}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                @{profile?.username}
              </span>
            </div>

            {/* Logout button - Constraint 3 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
              title="Đăng xuất khỏi hệ thống"
            >
              {isLoggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              <span className="text-xs font-medium">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center max-w-2xl">
        {/* Security Alert Header */}
        <div className="w-full mb-6">
          <Alert className="border-amber-300 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/20 text-foreground">
            <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <AlertTitle className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Yêu cầu bảo mật tài khoản lần đầu đăng nhập
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Đây là tài khoản mới khởi tạo. Để bảo vệ dữ liệu và đảm bảo quyền truy cập, vui lòng hoàn tất quy trình xác thực email và cập nhật mật khẩu trước khi vào hệ thống.
            </AlertDescription>
          </Alert>
        </div>

        {/* Stepper Indicator */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          {/* Step 1 Item */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              !isEmailPending
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : currentStep === 1
                  ? 'bg-primary/5 border-primary text-primary shadow-xs'
                  : 'bg-card border-border text-muted-foreground'
            }`}
          >
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                !isEmailPending
                  ? 'bg-emerald-500 text-white'
                  : currentStep === 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {!isEmailPending ? <CheckCircle2 className="size-4" /> : '1'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">
                1. Xác thực Email
              </span>
              <span className="text-[11px] opacity-80 truncate">
                {!isEmailPending ? 'Đã xác thực' : 'Bắt buộc thực hiện trước'}
              </span>
            </div>
          </div>

          {/* Step 2 Item */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              !isPasswordPending
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : currentStep === 2
                  ? 'bg-primary/5 border-primary text-primary shadow-xs'
                  : 'bg-card border-border text-muted-foreground opacity-60'
            }`}
          >
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                !isPasswordPending
                  ? 'bg-emerald-500 text-white'
                  : currentStep === 2
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {!isPasswordPending ? <CheckCircle2 className="size-4" /> : '2'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">
                2. Đổi mật khẩu lần đầu
              </span>
              <span className="text-[11px] opacity-80 truncate">
                {currentStep === 2 ? 'Đang thực hiện' : 'Sau khi xác thực email'}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: EMAIL VERIFICATION CARD */}
        {currentStep === 1 && (
          <Card className="w-full shadow-sm border-border/80">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Mail className="size-5" />
                  <span>Bước 1: Xác nhận quyền sở hữu Email</span>
                </div>
                <Badge variant="warning" appearance="light" size="xs">
                  Bắt buộc
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-1">
                Nhập mã xác thực đã gửi tới email
              </CardTitle>
              <CardDescription className="text-xs">
                Email là phương thức duy nhất để khôi phục mật khẩu khi bạn quên. Hệ thống đã gửi một mã số 6 chữ số tới hòm thư của bạn.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Server Info / Masked Email Notice */}
              <div className="p-3.5 rounded-lg bg-muted/60 border border-border text-xs flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Địa chỉ nhận mã:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {profile?.email || 'Email đã đăng ký'}
                  </span>
                </div>
                {emailServerMessage && (
                  <p className="text-muted-foreground mt-0.5">{emailServerMessage}</p>
                )}
                {emailStepState === 'sent' && (
                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground">Mã có hiệu lực trong:</span>
                    <span className={`font-mono font-bold ${countdown < 60 ? 'text-destructive' : 'text-primary'}`}>
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {emailError && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs font-medium">
                    {emailError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Verification Form */}
              <form onSubmit={emailForm.handleSubmit(onVerifyEmailSubmit)} className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="email-code" className="text-xs font-semibold">
                    Mã xác thực 6 chữ số
                  </Label>
                  <Input
                    id="email-code"
                    maxLength={6}
                    placeholder="123456"
                    className="font-mono text-center tracking-[0.4em] text-2xl h-12 font-bold"
                    {...emailForm.register('code')}
                    autoFocus
                  />
                  {emailForm.formState.errors.code && (
                    <p className="text-xs text-destructive font-medium">
                      {emailForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {/* Resend button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRequestEmailCode}
                    disabled={emailStepState === 'sending' || canResendAfter > 0}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`size-3.5 ${emailStepState === 'sending' ? 'animate-spin' : ''}`} />
                    <span>
                      {canResendAfter > 0
                        ? `Gửi lại mã sau (${canResendAfter}s)`
                        : 'Gửi lại mã mới'}
                    </span>
                  </Button>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isSubmittingCode || countdown <= 0}
                    className="gap-2 min-w-[140px]"
                  >
                    {isSubmittingCode && <Loader2 className="size-4 animate-spin" />}
                    <span>Xác nhận & Tiếp tục</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: PASSWORD CHANGE CARD */}
        {currentStep === 2 && (
          <Card className="w-full shadow-sm border-border/80">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <KeyRound className="size-5" />
                  <span>Bước 2: Đổi mật khẩu khởi tạo</span>
                </div>
                <Badge variant="warning" appearance="light" size="xs">
                  Bắt buộc
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-1">
                Thiết lập mật khẩu cá nhân mới
              </CardTitle>
              <CardDescription className="text-xs">
                Mật khẩu hiện tại do Quản trị viên cấp chỉ có hiệu lực tạm thời. Vui lòng đặt mật khẩu mới với tối thiểu 12 ký tự để tiếp tục.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {passwordError && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs font-medium">
                    {passwordError}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-semibold">
                    Mật khẩu hiện tại (Mật khẩu admin cấp)
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="pr-10 text-xs"
                      {...passwordForm.register('currentPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive font-medium">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold">
                    Mật khẩu mới (Tối thiểu 12 ký tự)
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Nhập ít nhất 12 ký tự"
                      className="pr-10 text-xs"
                      {...passwordForm.register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive font-medium">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                    Xác nhận mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      className="pr-10 text-xs"
                      {...passwordForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="gap-2 w-full sm:w-auto min-w-[180px]"
                  >
                    {isSubmittingPassword ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    <span>Đổi mật khẩu & Vào hệ thống</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t bg-background/50">
        Bảo mật bởi InJ System • Mọi thao tác đều được bảo vệ bởi xác thực 2 lớp
      </footer>
    </div>
  );
}
