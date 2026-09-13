import { SubjectItem } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  item: SubjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubjectDetailsDialog({ item, open, onOpenChange }: Props) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Course Details</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Course Code</span>
              <span className="text-base font-medium">{item.code}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Status</span>
              <div>
                <Badge variant={item.isActive ? 'success' : 'secondary'} appearance="light">
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Created At</span>
              <span className="text-sm">{new Date(item.createdAt).toLocaleString('en-US')}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Last Updated</span>
              <span className="text-sm">{new Date(item.updatedAt).toLocaleString('en-US')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Links List ({item.links.length})</span>
            <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/10">
              <ul className="flex flex-col gap-2">
                {item.links.map((link, idx) => (
                  <li key={idx} className="p-2 border-b last:border-0">
                    {link.label && <div className="font-medium text-sm mb-1">{link.label}</div>}
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline break-all">
                      {link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
