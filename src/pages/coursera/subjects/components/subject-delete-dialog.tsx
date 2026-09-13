import { useState } from 'react';
import { SubjectItem } from '../types';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  item: SubjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubjectDeleteDialog({ item, open, onOpenChange, onSuccess }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasOrderError, setHasOrderError] = useState(false);

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    setHasOrderError(false);
    
    try {
      await api.delete(`/coursera/subjects/${item.id}`);
      toast.success('Course deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      if (e?.response?.data?.code === 'COURSE_HAS_ORDERS') {
        setHasOrderError(true);
      } else {
        toast.error(e?.response?.data?.message || 'Could not delete course');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHideInstead = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      await api.patch(`/coursera/subjects/${item.id}`, { isActive: false });
      toast.success('Course hidden successfully');
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Could not hide course');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setHasOrderError(false);
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Course</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete course <strong>{item.code}</strong>?
          </DialogDescription>
        </DialogHeader>
        
        {hasOrderError ? (
          <div className="flex flex-col gap-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4" />
              Cannot delete due to existing orders
            </div>
            <p>This course has been used in orders, so it cannot be permanently deleted. Do you want to <strong>Hide</strong> this course instead? (Hidden courses will not appear in the order creation dropdown but previous orders will remain intact).</p>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleHideInstead} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Hide Course
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="py-2 text-sm text-muted-foreground flex flex-col gap-2">
              <p>Deleting this course will also delete all its associated questions in the question bank. This action cannot be undone.</p>
              <p>If you only want to hide this course temporarily, use the <b>Hide Subject</b> feature instead.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Delete Permanently
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
