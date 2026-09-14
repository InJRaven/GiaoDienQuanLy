import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { createRoleSchema, CreateRoleFormValues } from '../schemas';

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
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissionIds: [],
    },
  });

  const watchedDescription = watch('description');
  const watchedName = watch('name');
  const selectedPermissionIds = watch('permissionIds') || [];

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setIsNameManuallyEdited(false);
      setErrorMsg('');
    }
    onOpenChange(newOpen);
  };

  const handleDescriptionChange = (val: string) => {
    setValue('description', val);
    if (!isNameManuallyEdited) {
      const suggested = generateRoleKeyFromDescription(val);
      setValue('name', suggested);
    }
  };

  const togglePermission = (id: number) => {
    const current = selectedPermissionIds;
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    setValue('permissionIds', next);
  };

  const onSubmit = async (values: CreateRoleFormValues) => {
    setErrorMsg('');

    try {
      const payload: CreateRoleDto = {
        name: values.name.trim(),
        ...(values.description?.trim() ? { description: values.description.trim() } : {}),
        ...(values.permissionIds && values.permissionIds.length > 0
          ? { permissionIds: values.permissionIds }
          : {}),
      };

      const res = await api.post<RoleDetail>('/roles', payload);
      toast.success(`Role "${res.name}" created successfully!`);
      onSuccess(res.id);
      handleClose(false);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      if (serverCode === 'DUPLICATE_RESOURCE' || e?.response?.status === 409) {
        setError('name', { message: 'A role with this key already exists' });
        setErrorMsg(
          'Role key already in use. Please choose a different identifier.',
        );
      } else {
        setErrorMsg(
          e?.response?.data?.message ||
            'An error occurred while creating the role.',
        );
      }
    }
  };

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce<
    Record<string, PermissionItem[]>
  >((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldPlus className="size-5 text-primary" />
            Create New Role
          </DialogTitle>
          <DialogDescription>
            Define a new custom role with explicit key naming and initial permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 p-6 overflow-y-auto flex-1 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Description (Primary UI Input) */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Role Description / Display Title
              </Label>
              <Input
                value={watchedDescription || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="e.g. Quản lý kho, Kế toán trưởng"
                className="h-9 text-xs"
                disabled={isSubmitting}
                autoFocus
              />
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-primary shrink-0" />
                Type a human description to automatically generate a valid system key below.
              </span>
            </div>

            {/* Role Key (System Identifier) */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Role Key (System Identifier) <span className="text-destructive">*</span>
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  ^[a-z][a-z0-9_]*$
                </span>
              </div>

              <Input
                value={watchedName || ''}
                onChange={(e) => {
                  setValue('name', e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  setIsNameManuallyEdited(true);
                }}
                placeholder="e.g. quan_ly_kho"
                className={`font-mono text-xs h-9 bg-background ${
                  errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''
                }`}
                disabled={isSubmitting}
              />

              {errors.name ? (
                <span className="text-[11px] text-destructive font-medium">
                  {errors.name.message}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Unique, immutable identifier used in permission checks and API endpoints.
                </span>
              )}
            </div>

            {/* Initial Permissions Selection */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Initial Permissions ({selectedPermissionIds.length} selected)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  You can fine-tune permissions anytime in the matrix.
                </span>
              </div>

              <div className="border border-border rounded-xl p-3 max-h-60 overflow-y-auto space-y-4 bg-muted/10">
                {Object.keys(permissionsByModule).length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-4">
                    No permissions found.
                  </p>
                ) : (
                  Object.entries(permissionsByModule).map(([mod, perms]) => (
                    <div key={mod} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                          {MODULE_NAMES[mod] || mod}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {perms.filter((p) => selectedPermissionIds.includes(p.id)).length} /{' '}
                          {perms.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {perms.map((p) => {
                          const isChecked = selectedPermissionIds.includes(p.id);
                          const meta = PERMISSION_METADATA[p.code];
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                                isChecked
                                  ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                                  : 'bg-background border-border hover:bg-muted/50 text-foreground'
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(p.id)}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="capitalize truncate leading-tight">
                                  {meta?.label || p.action}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono truncate">
                                  {p.code}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="p-4 border-t border-border flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
