import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Loader2, LogOut, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { SessionItem, UserProfileResponse } from '../types';
import { profileService } from '../services/profile-service';
import { ChangePasswordDialog } from './change-password-dialog';
import { EmailVerificationDialog } from './email-verification-dialog';
import { SessionListItem } from './session-list-item';
import { EmailVerifiedBadge } from './user-status-badge';

interface SecurityCardProps {
  user: UserProfileResponse;
  onProfileRefresh: () => void;
}

export function SecurityCard({ user, onProfileRefresh }: SecurityCardProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [logoutAllDialogOpen, setLogoutAllDialogOpen] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const data = await profileService.getSessions();
      // Ensure sorted by lastUsedAt descending
      const sorted = [...data].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
      setSessions(sorted);
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSingle = async (sessionId: string) => {
    try {
      await profileService.deleteSession(sessionId);
      toast.success('Đã đăng xuất thiết bị thành công.');
      // Remove row immediately and refetch
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      await fetchSessions();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        // Session expired or not yours -> remove row and reload
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        await fetchSessions();
      } else if (status === 403) {
        toast.error('Không thể đăng xuất phiên làm việc hiện tại.');
      } else {
        toast.error('Không thể đăng xuất thiết bị. Vui lòng thử lại.');
      }
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await profileService.logoutAllSessions();
      toast.success('Đã đăng xuất tất cả các thiết bị.');
      setLogoutAllDialogOpen(false);
      // STRICT REQUIREMENT: Revokes all sessions including current.
      // Must clear state and redirect to login immediately!
      await logout();
      navigate('/auth/login', { replace: true });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Có lỗi xảy ra khi đăng xuất tất cả.',
      );
      setIsLoggingOutAll(false);
    }
  };

  return (
    <>
      <Card className="border border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            Bảo mật tài khoản
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-6">
          {/* Section 1: Password */}
          <div className="flex items-center justify-between py-2 border-b border-border/40 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Mật khẩu đăng nhập
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                •••••••••••• (Cập nhật định kỳ để bảo vệ tài khoản)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordDialogOpen(true)}
              className="shrink-0 cursor-pointer"
            >
              Đổi mật khẩu
            </Button>
          </div>

          {/* Section 2: Email Verification */}
          <div className="flex items-center justify-between py-2 border-b border-border/40 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Địa chỉ Email
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {user.email || 'Chưa cập nhật email'}
              </p>
            </div>
            <div className="shrink-0">
              <EmailVerifiedBadge
                verified={user.emailVerified}
                onVerifyClick={() => setEmailDialogOpen(true)}
                canVerify={true}
              />
            </div>
          </div>

          {/* Section 3: Active Sessions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Thiết bị đang đăng nhập
                </h4>
                <p className="text-xs text-muted-foreground">
                  Danh sách phiên truy cập đang hoạt động
                </p>
              </div>

              {sessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogoutAllDialogOpen(true)}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0 gap-1.5 cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  Đăng xuất tất cả
                </Button>
              )}
            </div>

            {isLoadingSessions ? (
              <div className="py-6 flex items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" />
                <span className="text-xs">Đang tải danh sách thiết bị...</span>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Không tìm thấy phiên đăng nhập nào.
              </p>
            ) : (
              <div className="divide-y divide-border/40 rounded-lg border border-border/60 p-2 bg-muted/20">
                {sessions.map((session) => (
                  <SessionListItem
                    key={session.sessionId}
                    session={session}
                    onRevoke={handleRevokeSingle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reserved Spot for 2FA (Part 2) */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-muted-foreground/60 italic">
              Bảo mật hai lớp (2FA) sẽ được hỗ trợ trong phiên bản nâng cấp tiếp theo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      {/* Email Verification Dialog */}
      <EmailVerificationDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSuccess={onProfileRefresh}
      />

      {/* Logout All Confirm Dialog */}
      <AlertDialog
        open={logoutAllDialogOpen}
        onOpenChange={setLogoutAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="size-5" />
              Đăng xuất khỏi tất cả các thiết bị?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Thao tác này sẽ chấm dứt mọi phiên làm việc trên các thiết bị và trình duyệt khác, <strong>bao gồm cả phiên hiện tại này</strong>. Bạn sẽ phải đăng nhập lại để tiếp tục sử dụng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOutAll}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOutAll && (
                <Loader2 className="size-4 animate-spin mr-2" />
              )}
              Đăng xuất tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
