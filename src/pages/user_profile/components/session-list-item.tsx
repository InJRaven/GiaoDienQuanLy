import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Laptop, Loader2, LogOut, Smartphone } from 'lucide-react';
import { SessionItem } from '../types';
import { formatDateTime, parseUserAgent } from '../utils';

interface SessionListItemProps {
  session: SessionItem;
  onRevoke: (sessionId: string) => Promise<void>;
}

export function SessionListItem({ session, onRevoke }: SessionListItemProps) {
  const [isRevoking, setIsRevoking] = useState(false);
  const { browser, os } = parseUserAgent(session.userAgent);
  const isMobile = os === 'iOS' || os === 'Android';

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke(session.sessionId);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-b-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          {isMobile ? (
            <Smartphone className="size-5" />
          ) : (
            <Laptop className="size-5" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {browser} · {os}
            </span>
            {session.current && (
              <Badge variant="success" appearance="light" size="sm" className="font-semibold">
                Thiết bị này
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>IP: {session.ip || '—'}</span>
            <span>·</span>
            <span>Hoạt động: {formatDateTime(session.lastUsedAt)}</span>
          </div>
        </div>
      </div>

      {/* Action: Current session has NO revoke button */}
      {!session.current && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 gap-1"
          onClick={handleRevoke}
          disabled={isRevoking}
        >
          {isRevoking ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LogOut className="size-3.5" />
          )}
          <span>Đăng xuất</span>
        </Button>
      )}
    </div>
  );
}
