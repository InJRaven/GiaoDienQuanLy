import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, PlusCircle, User } from 'lucide-react';
import { UserProfileResponse } from '../types';
import { formatDateOnly, maskSensitiveNumber } from '../utils';

interface PersonalInfoCardProps {
  user: UserProfileResponse;
  onAddInfoClick?: () => void;
  canEdit?: boolean;
}

export function PersonalInfoCard({
  user,
  onAddInfoClick,
  canEdit = true,
}: PersonalInfoCardProps) {
  // CRITICAL RULE 4.1: Check if 'profile' key exists in user object
  if (!('profile' in user) || user.profile === undefined) {
    // Viewer doesn't have permission to see profile -> completely hide card
    return null;
  }

  const profile = user.profile;

  // Check if all profile values are empty/null
  const isProfileEmpty =
    !profile ||
    (!profile.phone &&
      !profile.dateOfBirth &&
      !profile.idCardNumber &&
      !profile.address &&
      !profile.bankAccount &&
      !profile.bankName);

  const [showIdCard, setShowIdCard] = useState(false);
  const [showBankAccount, setShowBankAccount] = useState(false);

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <User className="size-4 text-primary" />
          Thông tin cá nhân
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {isProfileEmpty ? (
          // Empty state: permitted to view, but user has not filled any fields
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Chưa có thông tin cá nhân nào được bổ sung.
            </p>
            {canEdit && onAddInfoClick && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={onAddInfoClick}
              >
                <PlusCircle className="size-3.5" />
                Bổ sung thông tin
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            {/* Phone */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Số điện thoại</span>
              <span className="text-foreground font-medium">
                {profile?.phone || '—'}
              </span>
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Ngày sinh</span>
              <span className="text-foreground font-medium">
                {formatDateOnly(profile?.dateOfBirth)}
              </span>
            </div>

            {/* CMND/CCCD with Mask */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">CMND/CCCD</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-mono font-medium">
                  {profile?.idCardNumber
                    ? showIdCard
                      ? profile.idCardNumber
                      : maskSensitiveNumber(profile.idCardNumber, 4)
                    : '—'}
                </span>
                {profile?.idCardNumber && (
                  <button
                    type="button"
                    onClick={() => setShowIdCard(!showIdCard)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                    title={showIdCard ? 'Ẩn số CMND/CCCD' : 'Hiện số CMND/CCCD'}
                  >
                    {showIdCard ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 py-1.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium shrink-0">Địa chỉ</span>
              <span className="text-foreground font-medium sm:text-right max-w-md">
                {profile?.address || '—'}
              </span>
            </div>

            {/* Bank Account with Mask */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-mono font-medium">
                  {profile?.bankAccount
                    ? showBankAccount
                      ? profile.bankAccount
                      : maskSensitiveNumber(profile.bankAccount, 4)
                    : '—'}
                </span>
                {profile?.bankAccount && (
                  <button
                    type="button"
                    onClick={() => setShowBankAccount(!showBankAccount)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                    title={showBankAccount ? 'Ẩn số tài khoản' : 'Hiện số tài khoản'}
                  >
                    {showBankAccount ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bank Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5">
              <span className="text-muted-foreground font-medium">Ngân hàng</span>
              <span className="text-foreground font-medium">
                {profile?.bankName || '—'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
