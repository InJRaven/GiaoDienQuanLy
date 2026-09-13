import { useState } from 'react';
import { CreateSubjectDto, SubjectLink } from '../types';
import { api } from '@/lib/axios.config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubjectCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [links, setLinks] = useState<SubjectLink[]>([{ label: '', url: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!code.trim()) return 'Course Code is required.';
    const validLinks = links.filter((l) => l.url && l.url.trim().length > 0);
    if (validLinks.length === 0) return 'At least 1 Coursera link is required.';
    for (const link of validLinks) {
      if (!/^https?:\/\//i.test(link.url.trim())) {
        return 'URL must start with http:// or https://';
      }
    }
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const validLinks = links.filter((l) => l.url && l.url.trim().length > 0);
      const payload: CreateSubjectDto = {
        code: code.trim(),
        links: validLinks.map((l) => ({
          label: l.label?.trim() || undefined,
          url: l.url.trim(),
        })),
      };
      await api.post('/coursera/subjects', payload);
      toast.success('Course created successfully');
      onSuccess();
      onOpenChange(false);
      setCode('');
      setLinks([{ label: '', url: '' }]);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      if (serverCode === 'DUPLICATE_RESOURCE') {
        setError('Course Code already exists.');
      } else {
        setError(e?.response?.data?.message || 'An error occurred while creating course.');
      }
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
            Create New Course
          </DialogTitle>
          <DialogDescription>
            Register a unique course code and configure its Coursera Specialization or course links.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 py-2">
          {/* Course Code Input */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Course Code (Required)
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">A-Z, 0-9</span>
            </div>
            <Input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, ''))
              }
              placeholder="e.g. BCJ201C, CS101"
              disabled={isSubmitting}
              className="font-mono font-bold text-sm h-9 tracking-wide bg-background"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Unique course identifier. Cannot be edited after creation.
            </p>
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
            Create Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
