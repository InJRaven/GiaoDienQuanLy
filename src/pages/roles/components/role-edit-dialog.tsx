import { useEffect, useState } from 'react';
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
import {
  Edit3,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { formatRoleName, RoleDetail, UpdateRoleDto } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDetail | null;
  onSuccess: () => void;
}

export function RoleEditDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: Props) {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role && open) {
      setDescription(role.description || '');
      setName(role.name);
      setErrorMsg('');
      setFieldErrors({});
    }
  }, [role, open]);

  if (!role) return null;

  const isNameChanged = name.trim() !== role.name;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanName = name.trim();

    if (!cleanName) {
      errors.name = 'Role key is required';
    } else if (!/^[a-z][a-z0-9_]*$/.test(cleanName)) {
      errors.name =
        'Must start with a lowercase letter and contain only lowercase letters, numbers, and underscores';
    } else if (cleanName.length < 2 || cleanName.length > 50) {
      errors.name = 'Role key must be between 2 and 50 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setFieldErrors({});

    if (!validate()) return;

    const payload: UpdateRoleDto = {};
    let hasChanges = false;

    if (isNameChanged) {
      payload.name = name.trim();
      hasChanges = true;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc !== (role.description || '')) {
      payload.description = trimmedDesc;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info('No changes detected');
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/roles/${role.id}`, payload);
      toast.success(`Role "${role.name}" updated successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      if (serverCode === 'DUPLICATE_RESOURCE' || e?.response?.status === 409) {
        setFieldErrors({ name: 'A role with this key already exists' });
        setErrorMsg('Role key already in use by another role.');
      } else if (serverCode === 'ROLE_IS_SYSTEM') {
        setErrorMsg('System roles cannot be modified.');
      } else {
        setErrorMsg(
          e?.response?.data?.message ||
            'An error occurred while updating the role.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Edit3 className="size-5 text-primary" />
            Edit Role Details
          </DialogTitle>
          <DialogDescription>
            Update role title or key identifier for{' '}
            <strong className="text-foreground">{formatRoleName(role.name)}</strong>.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2 text-xs">
          {/* Role Description / Display Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">
              Role Description / Display Title
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Senior Accountant"
              className="h-9 text-xs"
              disabled={isSubmitting}
            />
            <span className="text-[11px] text-muted-foreground">
              User-facing description explaining the role responsibilities.
            </span>
          </div>

          {/* Role Key (System Identifier) */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-muted/20 border border-border">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              Role Key (System Identifier) <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) =>
                setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))
              }
              className={`font-mono text-xs h-9 bg-background ${
                fieldErrors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''
              }`}
              disabled={isSubmitting}
            />

            {fieldErrors.name && (
              <span className="text-[11px] text-destructive font-medium">
                {fieldErrors.name}
              </span>
            )}

            {/* Renaming Seed Warning */}
            {isNameChanged ? (
              <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-2 mt-1">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong>Warning: Database Seed Impact!</strong>
                  <p className="mt-0.5">
                    Modifying the system key can cause automated migrations or database seed scripts searching for <code>{role.name}</code> to recreate a duplicate empty role. Only rename if you understand the database dependencies.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                <Info className="size-3.5 shrink-0" />
                <span>Identifier used for database queries and permission checks.</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
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
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
