import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PositionOption } from '@/pages/users/types';
import { Pencil } from 'lucide-react';
import { UserProfileResponse } from '../types';
import { ProfileAvatar } from './profile-avatar';
import { EmailVerifiedBadge, UserStatusBadge } from './user-status-badge';

interface AccountProfileHeroProps {
  user: UserProfileResponse;
  position?: PositionOption | null;
  onEditClick: () => void;
  onVerifyEmailClick: () => void;
  canEdit?: boolean;
}

export function AccountProfileHero({
  user,
  position,
  onEditClick,
  onVerifyEmailClick,
  canEdit = true,
}: AccountProfileHeroProps) {
  const displayName = user.fullName || user.username || 'Người dùng';

  // Subtitle items: position · department · employeeCode
  const metaParts: string[] = [];
  if (position?.name) metaParts.push(position.name);
  if (user.department) metaParts.push(user.department);
  if (user.employeeCode) metaParts.push(user.employeeCode);

  return (
    <Card className="border border-border shadow-xs overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Left: Avatar + Details */}
          <div className="flex items-center gap-4.5">
            <ProfileAvatar
              id={user.id}
              fullName={user.fullName}
              username={user.username}
              avatarUrl={user.profile?.avatarUrl}
              size="lg"
            />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {displayName}
              </h2>

              {metaParts.length > 0 && (
                <div className="text-sm text-muted-foreground font-medium flex flex-wrap items-center gap-1.5">
                  {metaParts.map((part, index) => (
                    <span key={index} className="flex items-center gap-1.5">
                      {index > 0 && <span className="text-muted-foreground/50">·</span>}
                      <span>{part}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <UserStatusBadge
                  isActive={user.isActive}
                  employmentStatus={user.employmentStatus}
                />
                <EmailVerifiedBadge
                  verified={user.emailVerified}
                  onVerifyClick={onVerifyEmailClick}
                  canVerify={true}
                />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          {canEdit && (
            <div className="shrink-0 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={onEditClick}
              >
                <Pencil className="size-3.5" />
                Sửa hồ sơ
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
