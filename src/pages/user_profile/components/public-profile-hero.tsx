import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';
import { PositionOption } from '@/pages/users/types';
import { Mail, Pencil, Briefcase, Building2, IdCard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { UserProfileResponse } from '../types';
import { ProfileAvatar } from './profile-avatar';
import { EmailVerifiedBadge, UserStatusBadge } from './user-status-badge';

interface PublicProfileHeroProps {
  user: UserProfileResponse;
  position?: PositionOption | null;
  onEditClick: () => void;
  canEdit?: boolean;
}

export function PublicProfileHero({
  user,
  position,
  onEditClick,
  canEdit = false,
}: PublicProfileHeroProps) {
  const { theme } = useTheme();
  const displayName = user.fullName || user.username || 'Người dùng';

  return (
    <Card className="border border-border shadow-xs overflow-hidden">
      {/* Background Banner */}
      <div
        className="h-36 sm:h-44 w-full bg-cover bg-center bg-no-repeat relative flex items-end justify-end p-4"
        style={{
          backgroundImage:
            theme === 'dark'
              ? `url('${toAbsoluteUrl('/media/images/2600x1200/bg-1-dark.png')}')`
              : `url('${toAbsoluteUrl('/media/images/2600x1200/bg-1.png')}')`,
        }}
      >
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="bg-background/85 hover:bg-background backdrop-blur-xs gap-1.5 shadow-sm text-xs cursor-pointer"
            onClick={onEditClick}
          >
            <Pencil className="size-3.5" />
            Sửa hồ sơ
          </Button>
        )}
      </div>

      {/* Profile Details Container */}
      <div className="px-6 pb-6 pt-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 sm:-mt-14 mb-4 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Centered / Prominent Avatar */}
            <div className="relative">
              <ProfileAvatar
                id={user.id}
                fullName={user.fullName}
                username={user.username}
                avatarUrl={user.profile?.avatarUrl}
                size="xl"
                className="border-4 border-background shadow-md"
              />
            </div>

            {/* Name and Badges */}
            <div className="space-y-1.5 pt-2 sm:pt-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {displayName}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                <UserStatusBadge
                  isActive={user.isActive}
                  employmentStatus={user.employmentStatus}
                />
                <EmailVerifiedBadge
                  verified={user.emailVerified}
                  canVerify={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Tags */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border/60">
          {position?.name && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="size-4 text-muted-foreground/80" />
              <span>{position.name}</span>
            </div>
          )}

          {user.department && (
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4 text-muted-foreground/80" />
              <span>{user.department}</span>
            </div>
          )}

          {user.employeeCode && (
            <div className="flex items-center gap-1.5">
              <IdCard className="size-4 text-muted-foreground/80" />
              <span>{user.employeeCode}</span>
            </div>
          )}

          {user.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="size-4 text-muted-foreground/80" />
              <span>{user.email}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
