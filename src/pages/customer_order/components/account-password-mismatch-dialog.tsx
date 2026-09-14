import { AlertTriangle, CheckCircle2, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountEmail: string;
  orderCount: number;
  onUseExistingPassword: () => void;
  onUpdatePasswordForAll: () => void;
  isProcessing: boolean;
}

export function AccountPasswordMismatchDialog({
  open,
  onOpenChange,
  accountEmail,
  orderCount,
  onUseExistingPassword,
  onUpdatePasswordForAll,
  isProcessing,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(val) => !isProcessing && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="size-11 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-base text-foreground">
            Phát hiện mật khẩu khác với hệ thống
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Tài khoản <strong className="font-mono text-foreground">{accountEmail}</strong> đã
            tồn tại trong hệ thống với mật khẩu khác, hiện đang được áp dụng cho{' '}
            <strong className="text-foreground font-semibold">{orderCount} đơn hàng</strong>.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-lg bg-muted/40 border border-border text-muted-foreground text-[11px] leading-relaxed">
            Hệ thống không tự ý ghi đè mật khẩu vì có thể làm gián đoạn việc học ở các môn khác
            của khách. Vui lòng chọn cách xử lý bên dưới:
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Option 1 */}
            <div className="p-3 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted/30 transition-all flex items-start gap-3 text-left">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="size-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-xs">
                  1. Dùng mật khẩu đang lưu
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tạo đơn này bằng mật khẩu Coursera cũ của khách đang lưu trong hệ thống.
                </p>
              </div>
            </div>

            {/* Option 2 */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex items-start gap-3 text-left">
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw className="size-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-700 dark:text-amber-300 text-xs">
                  2. Cập nhật mật khẩu mới cho cả {orderCount} đơn
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Thay đổi mật khẩu tài khoản thành mật khẩu vừa nhập, áp dụng đồng bộ cho tất
                  cả các đơn của khách này.
                </p>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUseExistingPassword}
            disabled={isProcessing}
            className="w-full sm:w-auto text-xs h-9 gap-1.5"
          >
            {isProcessing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <KeyRound className="size-3.5" />
            )}
            <span>Dùng mật khẩu đang lưu</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onUpdatePasswordForAll}
            disabled={isProcessing}
            className="w-full sm:w-auto text-xs h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isProcessing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            <span>Cập nhật cho cả {orderCount} đơn</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
