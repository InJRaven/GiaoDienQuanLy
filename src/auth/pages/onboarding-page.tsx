import React, { useEffect, useRef, useState } from 'react';
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
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/context/auth-context';
import { authService } from '@/auth/services/auth-service';
import { api } from '@/lib/axios.config';
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

interface OnboardingPageProps {
  isModal?: boolean;
}

export function OnboardingPage({ isModal = false }: OnboardingPageProps) {
  const { profile, loading, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Email input states
  const [emailInput, setEmailInput] = useState<string>('');
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailInputError, setEmailInputError] = useState<string | null>(null);

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

  // Sync profile email to local state
  useEffect(() => {
    if (profile) {
      if (profile.email) {
        setEmailInput(profile.email);
        setIsEditingEmail(false);
      } else {
        setIsEditingEmail(true);
      }
    }
  }, [profile?.email]);

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

  // Ref to guarantee auto-trigger runs at most ONCE across renders
  const hasAutoRequestedRef = useRef(false);

  // Auto-trigger request code ONCE on mount ONLY if the user ALREADY has an email on file
  useEffect(() => {
    if (
      profile &&
      profile.emailVerified === false &&
      profile.email &&
      emailStepState === 'idle' &&
      !hasAutoRequestedRef.current
    ) {
      hasAutoRequestedRef.current = true;
      void handleRequestEmailCode();
    } else if (profile && !profile.email && !isEditingEmail) {
      setIsEditingEmail(true);
    }
  }, [profile?.emailVerified, profile?.email, emailStepState, isEditingEmail]);

  // Handle setting / updating email and requesting verification code
  const handleSaveAndSendEmailCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isUpdatingEmail || emailStepState === 'sending') return;

    const trimmed = emailInput.trim();
    if (!trimmed) {
      setEmailInputError('Vui lòng nhập địa chỉ email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailInputError('Địa chỉ email không đúng định dạng');
      return;
    }

    setEmailInputError(null);
    setIsUpdatingEmail(true);
    setEmailStepState('sending'); // Lock state immediately so useEffect won't see 'idle'
    hasAutoRequestedRef.current = true; // Lock ref to prevent any auto request
    setEmailError(null);

    try {
      // 1. Update user email in DB via API
      if (profile?.id) {
        try {
          await api.patch(`/users/${profile.id}`, { email: trimmed });
        } catch (patchErr: any) {
          console.warn('Could not patch /users/:id, attempting fallback:', patchErr);
          try {
            await api.patch('/users/me', { email: trimmed });
          } catch (meErr) {
            console.warn('Patch /users/me also failed:', meErr);
          }
        }
      }

      // 2. Request verification code to this new email (Single call)
      const res = await authService.requestEmailVerification();
      if (res.code === 'NO_EMAIL_ON_FILE') {
        setEmailError('Không thể gửi mã vì hệ thống chưa ghi nhận email. Vui lòng liên hệ quản trị viên.');
        setEmailStepState('idle');
        return;
      }

      setEmailServerMessage(res.message);
      setCountdown((res.expiresInMinutes || 10) * 60);
      setCanResendAfter(60);
      setEmailStepState('sent');
      setIsEditingEmail(false);
      toast.success(`Mã xác thực đã được gửi tới ${trimmed}`);

      // 3. Refresh profile state after code is sent
      await refreshProfile();
    } catch (err: any) {
      setEmailStepState('idle');
      const status = err?.response?.status;
      if (status === 429) {
        setEmailError('Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau một phút.');
      } else {
        setEmailError(
          err?.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.',
        );
      }
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Request email verification code for existing email
  const handleRequestEmailCode = async () => {
    if (!profile?.email) {
      setIsEditingEmail(true);
      return;
    }
    if (emailStepState === 'sending') return;

    setEmailStepState('sending');
    setEmailError(null);

    try {
      const res = await authService.requestEmailVerification();
      if (res.code === 'NO_EMAIL_ON_FILE') {
        setIsEditingEmail(true);
        setEmailError('Tài khoản chưa có địa chỉ email. Vui lòng nhập email của bạn.');
        setEmailStepState('idle');
        return;
      }
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

      // Refetch GET /users/me to clear mustChangePassword flag
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

  // Handle Logout
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

  // Card Content
  const content = (
    <div className="w-full max-w-xl mx-auto bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header with Brand & Logout */}
      <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            className="h-7 w-auto"
            alt="Logo"
          />
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-tight text-foreground">
              Hệ thống Quản lý
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Kích hoạt & Bảo mật tài khoản
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-foreground">
              {profile?.fullName || profile?.username}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              @{profile?.username}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            {isLoggingOut ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            <span>Đăng xuất</span>
          </Button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Security Alert Header */}
        <Alert className="border-amber-300 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/20 text-foreground py-2.5">
          <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="ml-1">
            <AlertTitle className="text-xs font-semibold text-amber-900 dark:text-amber-300">
              Yêu cầu bảo mật tài khoản lần đầu đăng nhập
            </AlertTitle>
            <AlertDescription className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Đây là tài khoản mới khởi tạo. Vui lòng hoàn tất quy trình xác thực email và cập nhật mật khẩu trước khi vào hệ thống.
            </AlertDescription>
          </div>
        </Alert>

        {/* Stepper Indicator */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Step 1 Item */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              !isEmailPending
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : currentStep === 1
                  ? 'bg-primary/5 border-primary text-primary shadow-xs'
                  : 'bg-card border-border text-muted-foreground'
            }`}
          >
            <div
              className={`size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
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
              <span className="text-[10px] opacity-80 truncate">
                {!isEmailPending ? 'Đã hoàn thành' : 'Bắt buộc thực hiện trước'}
              </span>
            </div>
          </div>

          {/* Step 2 Item */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              !isPasswordPending
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : currentStep === 2
                  ? 'bg-primary/5 border-primary text-primary shadow-xs'
                  : 'bg-card border-border text-muted-foreground opacity-60'
            }`}
          >
            <div
              className={`size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
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
              <span className="text-[10px] opacity-80 truncate">
                {currentStep === 2 ? 'Đang thực hiện' : 'Sau khi xác thực email'}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: EMAIL VERIFICATION */}
        {currentStep === 1 && (
          <Card className="w-full shadow-xs border-border/80">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <Mail className="size-4" />
                  <span>Bước 1: Xác nhận quyền sở hữu Email</span>
                </div>
                <Badge variant="warning" appearance="light" size="xs">
                  Bắt buộc
                </Badge>
              </div>
              <CardTitle className="text-sm font-bold mt-1">
                {isEditingEmail
                  ? 'Nhập địa chỉ email nhận mã xác thực'
                  : 'Nhập mã xác thực đã gửi tới email'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isEditingEmail
                  ? 'Tài khoản chưa có email hoặc bạn cần đổi email. Nhập email chính xác để nhận mã kích hoạt 6 chữ số.'
                  : 'Email là phương thức khôi phục mật khẩu duy nhất. Hệ thống đã gửi mã 6 chữ số tới hộp thư của bạn.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
              {/* Form 1A: Input/Edit Email */}
              {isEditingEmail ? (
                <form onSubmit={handleSaveAndSendEmailCode} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-input" className="text-xs font-semibold">
                      Địa chỉ Email nhận mã <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email-input"
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (emailInputError) setEmailInputError(null);
                        }}
                        placeholder="vidu@company.com"
                        className="h-10 text-xs ps-9"
                        disabled={isUpdatingEmail}
                        autoFocus
                      />
                      <Mail className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {emailInputError && (
                      <p className="text-xs text-destructive font-medium">
                        {emailInputError}
                      </p>
                    )}
                  </div>

                  {emailError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="size-4" />
                      <AlertDescription className="text-xs font-medium">
                        {emailError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {profile?.email ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingEmail(false);
                          setEmailInput(profile.email || '');
                          setEmailInputError(null);
                        }}
                        disabled={isUpdatingEmail}
                        className="text-xs"
                      >
                        Hủy thay đổi
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">
                        Bắt buộc có email để kích hoạt
                      </span>
                    )}
                    <Button
                      type="submit"
                      disabled={isUpdatingEmail || !emailInput.trim()}
                      className="gap-2 ms-auto min-w-[150px]"
                    >
                      {isUpdatingEmail ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Mail className="size-4" />
                      )}
                      <span>Gửi mã xác thực</span>
                    </Button>
                  </div>
                </form>
              ) : (
                /* Form 1B: Enter Verification Code */
                <>
                  {/* Email badge & countdown */}
                  <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Địa chỉ nhận mã:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground font-mono">
                          {profile?.email || emailInput}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingEmail(true);
                            setEmailError(null);
                          }}
                          className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                        >
                          Đổi email
                        </button>
                      </div>
                    </div>
                    {emailServerMessage && (
                      <p className="text-muted-foreground">{emailServerMessage}</p>
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
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="size-4" />
                      <AlertDescription className="text-xs font-medium">
                        {emailError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Verification Form */}
                  <form onSubmit={emailForm.handleSubmit(onVerifyEmailSubmit)} className="space-y-3.5 pt-1">
                    <div className="space-y-1.5">
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

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRequestEmailCode}
                        disabled={emailStepState === 'sending' || canResendAfter > 0}
                        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <RefreshCw className={`size-3.5 ${emailStepState === 'sending' ? 'animate-spin' : ''}`} />
                        <span>
                          {canResendAfter > 0
                            ? `Gửi lại mã sau (${canResendAfter}s)`
                            : 'Gửi lại mã mới'}
                        </span>
                      </Button>

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
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: PASSWORD CHANGE CARD */}
        {currentStep === 2 && (
          <Card className="w-full shadow-xs border-border/80">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <KeyRound className="size-4" />
                  <span>Bước 2: Đổi mật khẩu khởi tạo</span>
                </div>
                <Badge variant="warning" appearance="light" size="xs">
                  Bắt buộc
                </Badge>
              </div>
              <CardTitle className="text-sm font-bold mt-1">
                Thiết lập mật khẩu cá nhân mới
              </CardTitle>
              <CardDescription className="text-xs">
                Mật khẩu hiện tại do Quản trị viên cấp chỉ có hiệu lực tạm thời. Vui lòng đặt mật khẩu mới với tối thiểu 12 ký tự để hoàn tất.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5 px-4 sm:px-5 pb-5">
              {passwordError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs font-medium">
                    {passwordError}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-3.5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-semibold">
                    Mật khẩu hiện tại (Mật khẩu admin cấp) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="pr-10 text-xs h-9"
                      {...passwordForm.register('currentPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
                    Mật khẩu mới (Tối thiểu 12 ký tự) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Nhập ít nhất 12 ký tự"
                      className="pr-10 text-xs h-9"
                      {...passwordForm.register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
                    Xác nhận mật khẩu mới <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      className="pr-10 text-xs h-9"
                      {...passwordForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
      </div>

      {/* Footer */}
      <div className="py-2.5 px-4 text-center text-[11px] text-muted-foreground border-t bg-muted/20">
        Bảo mật bởi InJ System • Mọi thao tác đều được bảo vệ bởi xác thực 2 lớp
      </div>
    </div>
  );

  // If used as modal inside dashboard
  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
        {content}
      </div>
    );
  }

  // Standalone full-page view (also perfectly centered)
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-muted/40 dark:bg-background flex items-center justify-center p-4 sm:p-6">
      {content}
    </div>
  );
}
