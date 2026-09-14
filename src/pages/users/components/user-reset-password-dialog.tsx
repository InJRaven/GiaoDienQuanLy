import { useState } from 'react';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  KeyRound,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Wand2,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { ResetPasswordResponse, UserListItem } from '../types';
import { resetPasswordSchema } from '../schemas';

interface Props {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isSelf?: boolean;
}

function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()_+-=';
  const all = upper + lower + digits + symbols;

  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < 14; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  return pwd
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

export function UserResetPasswordDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  isSelf,
}: Props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{
    revokedSessions: number;
    newPassword: string;
  } | null>(null);

  const { isCopied, copyToClipboard } = useCopyToClipboard({
    onCopy: () => toast.success('New password copied to clipboard'),
  });

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword('');
      setShowPassword(false);
      setErrorMsg('');
      setSuccessData(null);
    }
    onOpenChange(newOpen);
  };

  const handleReset = async () => {
    if (!user) return;
    if (isSelf) {
      toast.error('You cannot reset your own password here.');
      return;
    }

    const parseResult = resetPasswordSchema.safeParse({ password });
    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0]?.message || 'Invalid password');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await api.post<ResetPasswordResponse>(
        `/users/${user.id}/reset-password`,
        { password },
      );

      toast.success(
        `Password reset for ${user.username}. Revoked ${response.revokedSessions} active session(s).`,
      );
      setSuccessData({
        revokedSessions: response.revokedSessions,
        newPassword: password,
      });
      onSuccess();
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.message || 'An error occurred while resetting password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            Reset Employee Password
          </DialogTitle>
          <DialogDescription>
            Issue a new password for account{' '}
            <strong className="text-foreground">{user.fullName}</strong> ({user.username}).
          </DialogDescription>
        </DialogHeader>

        {successData ? (
          <DialogBody className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Check className="size-5 text-emerald-500 shrink-0" />
                Password reset successfully!
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Revoked <strong>{successData.revokedSessions}</strong> active session(s) (user has been logged out of all devices). Copy the new password below to deliver to the employee.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                New Password
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-base text-primary tracking-wider select-all">
                  {successData.newPassword}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(successData.newPassword)}
                  className="gap-1.5 h-8 text-xs shrink-0"
                >
                  {isCopied ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => handleClose(false)}>Close</Button>
            </div>
          </DialogBody>
        ) : (
          <>
            <DialogBody className="space-y-4 py-2">
              {/* 3 effects notification */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="size-4 text-amber-500 shrink-0" />
                  Three actions will take effect simultaneously:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
                  <li>Employee password will be updated to the string entered.</li>
                  <li>Employee <strong>is required to change password</strong> upon next login.</li>
                  <li><strong>All active sessions</strong> across all devices will be revoked immediately.</li>
                </ol>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider">
                    New Password <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateStrongPassword())}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="size-3" /> Generate
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Enter at least 12 characters"
                    className="font-mono text-xs h-9 pe-10 bg-background"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Minimum 12 characters</span>
                  <span
                    className={`font-mono font-medium ${
                      password.length >= 12
                        ? 'text-emerald-500'
                        : password.length > 0
                        ? 'text-amber-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {password.length}/12 chars
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </DialogBody>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                disabled={isSubmitting || password.length < 12}
                className="gap-1.5"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Confirm Reset
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
