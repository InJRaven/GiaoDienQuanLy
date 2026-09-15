import { useState, useEffect } from 'react';
import { getAvatarColor, getInitials } from '../utils';

interface ProfileAvatarProps {
  id: number | string | undefined | null;
  fullName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProfileAvatar({
  id,
  fullName,
  username,
  avatarUrl,
  size = 'lg',
  className = '',
}: ProfileAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error if avatarUrl changes
  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  const initials = getInitials(fullName || username);
  const colorClass = getAvatarColor(id);

  const sizeClasses = {
    sm: 'size-9 text-xs',
    md: 'size-12 text-sm',
    lg: 'size-20 text-xl font-bold',
    xl: 'size-24 lg:size-28 text-2xl lg:text-3xl font-bold',
  }[size];

  const validUrl = avatarUrl && avatarUrl.trim() !== '' && !hasError;

  if (validUrl) {
    return (
      <img
        src={avatarUrl.trim()}
        alt={fullName || username || 'Avatar'}
        onError={() => setHasError(true)}
        className={`rounded-full object-cover shrink-0 border-2 border-background shadow-xs ${sizeClasses} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 border-2 border-background shadow-xs select-none ${colorClass} ${sizeClasses} ${className}`}
      title={fullName || username || undefined}
    >
      {initials}
    </div>
  );
}
