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
import { Loader2 } from 'lucide-react';

interface Props {
  item: SubjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubjectToggleDialog({ item, open, onOpenChange, onSuccess }: Props) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!item) return;
    setIsToggling(true);
    
    try {
      await api.patch(`/coursera/subjects/${item.id}`, { isActive: !item.isActive });
      toast.success(item.isActive ? 'Course hidden' : 'Course shown');
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Could not toggle course status');
    } finally {
      setIsToggling(false);
    }
  };

  if (!item) return null;
  const isCurrentlyActive = item.isActive;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCurrentlyActive ? 'Hide Course' : 'Show Course'}</DialogTitle>
          <DialogDescription>
            {isCurrentlyActive 
              ? `Are you sure you want to hide course ${item.code}? It will no longer appear in the dropdown when creating new orders.`
              : `Are you sure you want to show course ${item.code} again?`}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isToggling}>Cancel</Button>
          <Button variant={isCurrentlyActive ? "destructive" : "primary"} onClick={handleToggle} disabled={isToggling}>
            {isToggling ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
