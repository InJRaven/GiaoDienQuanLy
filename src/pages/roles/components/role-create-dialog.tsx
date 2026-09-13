import { useState } from 'react';
import { AlertCircle, Info, Loader2, ShieldPlus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CreateRoleDto,
  generateRoleKeyFromDescription,
  MODULE_NAMES,
  PERMISSION_METADATA,
  PermissionItem,
  RoleDetail,
} from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allPermissions: PermissionItem[];
  onSuccess: (newRoleId: number) => void;
}

export function RoleCreateDialog({
  open,
  onOpenChange,
  allPermissions,
  onSuccess,
}: Props) {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    [],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setDescription('');
    setName('');
    setIsNameManuallyEdited(false);
    setSelectedPermissionIds([]);
    setErrorMsg('');
    setFieldErrors({});
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (!isNameManuallyEdited) {
      const suggested = generateRoleKeyFromDescription(val);
      setName(suggested);
      if (fieldErrors.name) {
        setFieldErrors((prev) => ({ ...prev, name: '' }));
      }
    }
  };

  const handleNameChange = (val: string) => {
    setName(val.toLowerCase().replace(/\s+/g, '_'));
    setIsNameManuallyEdited(true);
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: '' }));
    }
  };

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

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setFieldErrors({});

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload: CreateRoleDto = {
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(selectedPermissionIds.length > 0
          ? { permissionIds: selectedPermissionIds }
          : {}),
      };

      const res = await api.post<RoleDetail>('/roles', payload);
      toast.success(`Role "${res.name}" created successfully!`);
      onSuccess(res.id);
      handleClose(false);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      if (serverCode === 'DUPLICATE_RESOURCE' || e?.response?.status === 409) {
        setFieldErrors({ name: 'A role with this key already exists' });
        setErrorMsg(
          'Role key already in use. Please choose a different identifier.',
        );
      } else {
        setErrorMsg(
          e?.response?.data?.message ||
            'An error occurred while creating the role.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by module for initial assignment
  const groupedPermissions = allPermissions.reduce<
    Record<string, PermissionItem[]>
  >((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldPlus className="size-5 text-primary" />
            Create New Role
          </DialogTitle>
          <DialogDescription>
            Define a role identifier, description, and optional initial
            permissions.
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
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="e.g. Senior Accountant, Regional Manager"
              className="h-9 text-xs"
              disabled={isSubmitting}
              autoFocus
            />
            <span className="text-[11px] text-muted-foreground">
              Human-readable title describing what this role is for.
            </span>
          </div>

          {/* Role Key (System Identifier) */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Role Key (System Identifier){' '}
                <span className="text-destructive">*</span>
              </Label>
              {!isNameManuallyEdited && name && (
                <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                  <Sparkles className="size-3" /> Auto-suggested
                </span>
              )}
            </div>

            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. senior_accountant"
              className={`font-mono text-xs h-9 bg-background ${
                fieldErrors.name
                  ? 'border-destructive focus-visible:ring-destructive/30'
                  : ''
              }`}
              disabled={isSubmitting}
            />

            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-0.5">
              <Info className="size-3.5 shrink-0 mt-0.5" />
              <span>
                Business identifier used in code and database lookups. Only
                lowercase letters, numbers, and underscores (
                <code>^[a-z][a-z0-9_]*$</code>).
              </span>
            </div>

            {fieldErrors.name && (
              <span className="text-[11px] text-destructive font-medium">
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Initial Permissions Picker (Optional) */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Initial Permissions (Optional)
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {selectedPermissionIds.length} selected
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              You can assign permissions now or configure them later in the
              matrix.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-3 pt-1 pe-1">
              {Object.entries(groupedPermissions).map(([moduleKey, perms]) => (
                <div key={moduleKey} className="space-y-1.5">
                  <span className="font-semibold text-[11px] text-foreground">
                    {MODULE_NAMES[moduleKey] || moduleKey}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {perms.map((perm) => {
                      const isChecked = selectedPermissionIds.includes(perm.id);
                      const meta = PERMISSION_METADATA[perm.code];
                      return (
                        <div
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          title={meta?.description || perm.code}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors select-none ${
                            isChecked
                              ? 'bg-primary/10 border-primary text-foreground'
                              : 'bg-background hover:bg-muted/40 border-border text-muted-foreground'
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(perm.id)}
                            className="size-3.5 mt-0.5 shrink-0"
                          />
                          <div className="flex flex-col min-w-0 grow">
                            <span className="font-medium text-[11px] text-foreground truncate">
                              {meta?.title || perm.code}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground truncate">
                              {perm.code}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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
            onClick={() => handleClose(false)}
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
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
