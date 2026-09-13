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
import { Edit3, Loader2, AlertCircle, Info } from 'lucide-react';
import { UpdateUserDto, UserListItem } from '../types';

interface Props {
  user: UserListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserEditDialog({ user, open, onOpenChange, onSuccess }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');
  const [hireDate, setHireDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && open) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setEmployeeCode(user.employeeCode || '');
      setDepartment(user.department || '');
      setHireDate(user.hireDate || '');
      setErrorMsg('');
      setFieldErrors({});
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!user) return;
    setErrorMsg('');
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full name cannot be empty';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email address format';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Compute diff: send only changed fields, send null if cleared, omit if unchanged
    const payload: UpdateUserDto = {};
    let hasChanges = false;

    const trimmedFullName = fullName.trim();
    if (trimmedFullName !== (user.fullName || '')) {
      payload.fullName = trimmedFullName;
      hasChanges = true;
    }

    const trimmedEmail = email.trim();
    const originalEmail = user.email || '';
    if (trimmedEmail !== originalEmail) {
      payload.email = trimmedEmail ? trimmedEmail : null;
      hasChanges = true;
    }

    const trimmedEmpCode = employeeCode.trim();
    const originalEmpCode = user.employeeCode || '';
    if (trimmedEmpCode !== originalEmpCode) {
      payload.employeeCode = trimmedEmpCode ? trimmedEmpCode : null;
      hasChanges = true;
    }

    const trimmedDept = department.trim();
    const originalDept = user.department || '';
    if (trimmedDept !== originalDept) {
      payload.department = trimmedDept ? trimmedDept : null;
      hasChanges = true;
    }

    const originalHireDate = user.hireDate || '';
    if (hireDate !== originalHireDate) {
      payload.hireDate = hireDate ? hireDate : null;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info('No changes detected to update');
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/users/${user.id}`, payload);
      toast.success('Employee profile updated successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      const details = e?.response?.data?.details;

      if (serverCode === 'DUPLICATE_RESOURCE' && details?.fields) {
        const errs: Record<string, string> = {};
        for (const f of details.fields) {
          if (f === 'email') errs.email = 'This email is already in use by another user';
          if (f === 'employeeCode')
            errs.employeeCode = 'This employee code is already taken';
        }
        setFieldErrors(errs);
        setErrorMsg('Duplicate data conflict with another employee.');
      } else {
        setErrorMsg(
          e?.response?.data?.message ||
            'An error occurred while updating employee profile.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5 text-primary" />
            Edit Employee Profile
          </DialogTitle>
          <DialogDescription>
            Update personal employee information. Only modified fields will be sent.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          {/* Read-only Username banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Username (Immutable)
              </span>
              <span className="font-mono font-bold text-sm text-foreground">
                {user.username}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground italic">
              <Info className="size-3.5 shrink-0" />
              Locked for audit compliance
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                  }
                }}
                className={`h-9 text-xs ${
                  fieldErrors.fullName ? 'border-destructive focus-visible:ring-destructive/30' : ''
                }`}
                disabled={isSubmitting}
              />
              {fieldErrors.fullName && (
                <span className="text-[11px] text-destructive">
                  {fieldErrors.fullName}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="Leave empty to clear email"
                className={`h-9 text-xs ${
                  fieldErrors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''
                }`}
                disabled={isSubmitting}
              />
              {fieldErrors.email && (
                <span className="text-[11px] text-destructive">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Employee Code */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Employee Code</Label>
              <Input
                value={employeeCode}
                onChange={(e) => {
                  setEmployeeCode(e.target.value.toUpperCase());
                  if (fieldErrors.employeeCode) {
                    setFieldErrors((prev) => ({ ...prev, employeeCode: '' }));
                  }
                }}
                placeholder="Leave empty to clear code"
                className={`font-mono text-xs h-9 ${
                  fieldErrors.employeeCode ? 'border-destructive focus-visible:ring-destructive/30' : ''
                }`}
                disabled={isSubmitting}
              />
              {fieldErrors.employeeCode && (
                <span className="text-[11px] text-destructive">
                  {fieldErrors.employeeCode}
                </span>
              )}
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Leave empty to clear department"
                className="h-9 text-xs"
                disabled={isSubmitting}
              />
            </div>

            {/* Hire Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Hire Date</Label>
              <Input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="h-9 text-xs font-mono"
                disabled={isSubmitting}
              />
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
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
