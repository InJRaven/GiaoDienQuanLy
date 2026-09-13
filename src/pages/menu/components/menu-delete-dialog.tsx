import { AdminMenuItem } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  item: AdminMenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: (item: AdminMenuItem) => Promise<void>;
  onSwitchToDeactivate: (item: AdminMenuItem) => Promise<void>;
}

export function MenuDeleteDialog({ item, open, onOpenChange, onConfirmDelete, onSwitchToDeactivate }: Props) {
  if (!item) return null;

  const handleConfirm = async () => {
    await onConfirmDelete(item);
    onOpenChange(false);
  };

  const handleDeactivate = async () => {
    await onSwitchToDeactivate(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Menu Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete item "{item.title || item.key}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 text-xs">
          <p>If you just want to temporarily hide this item, select <b>Hide from menu only</b> instead of deleting permanently.</p>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="secondary" onClick={handleDeactivate}>Hide from menu only</Button>
          <Button variant="destructive" onClick={handleConfirm}>Delete Permanently</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
