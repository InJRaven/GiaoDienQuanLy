import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApiQuery } from '@/hooks/use-api-query';
import { useMinDelay } from '@/hooks/use-min-delay';
import { PositionOption } from '@/pages/users/types';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { AccountProfileHero } from './components/account-profile-hero';
import { EmailVerificationDialog } from './components/email-verification-dialog';
import { PersonalInfoCard } from './components/personal-info-card';
import { ProfileEditDialog } from './components/profile-edit-dialog';
import { PublicProfileHero } from './components/public-profile-hero';
import { RolesCard } from './components/roles-card';
import { SecurityCard } from './components/security-card';
import { UserProfileSkeleton } from './components/user-profile-skeleton';
import { WorkInfoCard } from './components/work-info-card';
import { UserProfileResponse } from './types';

interface UserProfilePageProps {
  mode?: 'my_profile' | 'admin';
}

export function UserProfilePage({ mode = 'my_profile' }: UserProfilePageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { roles: authRoles, can } = useAuth();

  const isMyProfile = mode === 'my_profile';

  // Permission checks
  const canViewAdmin = isMyProfile || can('users:view');
  const canUpdate = isMyProfile || can('users:update');

  // Query profile data
  const profileEndpoint = isMyProfile ? '/users/me' : `/users/${id}`;
  const queryKey = isMyProfile ? ['users', 'me'] : ['users', id, 'profile'];

  const {
    data: user,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useApiQuery<UserProfileResponse>(queryKey, profileEndpoint, {
    enabled: Boolean(isMyProfile || (id && canViewAdmin)),
  });

  // Query job positions for position lookup
  const { data: positions = [] } = useApiQuery<PositionOption[]>(
    ['users', 'positions'],
    '/users/positions',
    {
      staleTime: 5 * 60 * 1000,
    },
  );

  // Smooth skeleton delay to prevent UI flicker
  const { showInitialSkeleton } = useMinDelay({
    isLoading,
    isFetching,
    hasData: Boolean(user),
    triggerKey: `${mode}-${id || 'me'}`,
    options: {
      initialDelay: 700,
    },
  });

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailVerifyDialogOpen, setEmailVerifyDialogOpen] = useState(false);

  // Resolve position
  const resolvedPosition = useMemo(() => {
    if (!user || user.positionId === undefined || user.positionId === null) {
      return null;
    }
    const numericPosId =
      typeof user.positionId === 'number'
        ? user.positionId
        : parseInt(String(user.positionId), 10);
    return positions.find((p) => p.id === numericPosId) || user.position || null;
  }, [user, positions]);

  // Resolve roles: My Profile uses auth context; Admin uses user.roles
  const resolvedRoles = useMemo(() => {
    if (isMyProfile) {
      return authRoles;
    }
    return user?.roles || [];
  }, [isMyProfile, authRoles, user]);

  // Handle permission denied for Admin mode
  if (!isMyProfile && !canViewAdmin) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="size-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
            <p className="text-sm text-muted-foreground">
              Bạn cần có quyền <code>users:view</code> để xem hồ sơ nhân viên này.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/users')}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle Skeleton state
  if (showInitialSkeleton || (!user && isLoading)) {
    return (
      <div className="container py-6 space-y-6 max-w-7xl mx-auto">
        <UserProfileSkeleton mode={mode} />
      </div>
    );
  }

  // Handle Error state
  if (error || !user) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="size-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold">Không tìm thấy hồ sơ người dùng</h2>
            <p className="text-sm text-muted-foreground">
              {(error as any)?.response?.data?.message ||
                'Đã xảy ra lỗi khi tải thông tin hồ sơ người dùng.'}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Thử lại
              </Button>
              {!isMyProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/users')}
                  className="gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  Danh sách nhân sự
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. HERO SECTION */}
      {isMyProfile ? (
        <AccountProfileHero
          user={user}
          position={resolvedPosition}
          onEditClick={() => setEditDialogOpen(true)}
          onVerifyEmailClick={() => setEmailVerifyDialogOpen(true)}
          canEdit={canUpdate}
        />
      ) : (
        <PublicProfileHero
          user={user}
          position={resolvedPosition}
          onEditClick={() => setEditDialogOpen(true)}
          canEdit={canUpdate}
        />
      )}

      {/* 2. TWO-COLUMN GRID (< 1024px: single column, left first, right second) */}
      {isMyProfile ? (
        // Mode "My Profile": Left = Personal + Work + Roles, Right = Security
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column */}
          <div className="space-y-6">
            <PersonalInfoCard
              user={user}
              onAddInfoClick={() => setEditDialogOpen(true)}
              canEdit={canUpdate}
            />
            <WorkInfoCard user={user} position={resolvedPosition} />
            <RolesCard roles={resolvedRoles} />
          </div>

          {/* Right Column: Security Card (Visible in My Profile) */}
          <div className="space-y-6">
            <SecurityCard user={user} onProfileRefresh={() => refetch()} />
          </div>
        </div>
      ) : (
        // Mode "Admin View": Left = Personal Info (if permitted), Right = Work + Roles
        // STRICT REQUIREMENT: Security Card is COMPLETELY HIDDEN
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <PersonalInfoCard
              user={user}
              onAddInfoClick={() => setEditDialogOpen(true)}
              canEdit={canUpdate}
            />
          </div>

          <div className="space-y-6">
            <WorkInfoCard user={user} position={resolvedPosition} />
            <RolesCard roles={resolvedRoles} />
          </div>
        </div>
      )}

      {/* Profile Edit Dialog */}
      {editDialogOpen && (
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={user}
          isMyProfile={isMyProfile}
          onSuccess={() => refetch()}
        />
      )}

      {/* Email Verification Dialog for My Profile */}
      {emailVerifyDialogOpen && (
        <EmailVerificationDialog
          open={emailVerifyDialogOpen}
          onOpenChange={setEmailVerifyDialogOpen}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
