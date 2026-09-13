import { useEffect, useState } from 'react';
import { SubjectItem, UpdateSubjectDto, SubjectLink } from '../types';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
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
import { SubjectLinksEditor } from './subject-links-editor';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Props {
  item: SubjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubjectEditDialog({ item, open, onOpenChange, onSuccess }: Props) {
  const [links, setLinks] = useState<SubjectLink[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item && open) {
      setLinks(item.links && item.links.length > 0 ? item.links : [{ label: '', url: '' }]);
      setIsActive(item.isActive);
      setError('');
    }
  }, [item, open]);

  const validate = () => {
    const validLinks = links.filter((l) => l.url && l.url.trim().length > 0);
    if (validLinks.length === 0) return 'At least 1 link is required.';
    for (const link of validLinks) {
      if (!/^https?:\/\//i.test(link.url.trim())) {
        return 'URL must start with http:// or https://';
      }
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!item) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const validLinks = links.filter((l) => l.url && l.url.trim().length > 0);
      const payload: UpdateSubjectDto = {
        isActive,
        links: validLinks.map((l) => ({
          label: l.label?.trim() || undefined,
          url: l.url.trim(),
        })),
      };
      await api.patch(`/coursera/subjects/${item.id}`, payload);
      toast.success('Course updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'An error occurred while updating course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Edit Course: <span className="font-mono text-primary font-bold">{item?.code}</span>
          </DialogTitle>
          <DialogDescription>
            Course code is read-only. Update link configuration and display status below.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 py-2">
          {/* Status Switcher Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider text-foreground">
                Course Visibility
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isActive
                  ? 'Course is active and available for order processing.'
                  : 'Course is inactive and hidden from orders.'}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
          </div>

          {/* Links Configuration */}
          <SubjectLinksEditor
            links={links}
            onChange={setLinks}
            disabled={isSubmitting}
          />

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
