import { useState } from 'react';
import { api } from '@/lib/axios.config';
import { useApiQuery } from '@/hooks/use-api-query';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Wand2,
  Check,
  Copy,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { CreateUserDto, EmploymentStatus, formatRoleName, UserRole } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()_+-=';
  const all = upper + lower + digits + symbols;

  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < 14; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  return pwd
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

export function UserCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [employmentStatus, setEmploymentStatus] =
    useState<EmploymentStatus>('active');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmEmptyRoles, setConfirmEmptyRoles] = useState(false);

  // Success summary modal
  const [createdSummary, setCreatedSummary] = useState<{
    username: string;
    password: string;
    fullName: string;
  } | null>(null);

  const { isCopied, copyToClipboard } = useCopyToClipboard({
    onCopy: () => toast.success('Account credentials copied to clipboard'),
  });

  // Fetch available roles
  const { data: roles = [], isLoading: isLoadingRoles } = useApiQuery<
    UserRole[]
  >(['users', 'roles'], '/users/roles', {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setFullName('');
    setEmail('');
    setEmployeeCode('');
    setDepartment('');
    setHireDate('');
    setEmploymentStatus('active');
    setSelectedRoleIds([]);
    setErrorMsg('');
    setFieldErrors({});
    setConfirmEmptyRoles(false);
    setCreatedSummary(null);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      errors.username = 'Username is required';
    } else if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      errors.username = 'Username must be between 3 and 50 characters';
    } else if (!/^[A-Za-z0-9._-]+$/.test(cleanUsername)) {
      errors.username = 'Only letters, numbers, and characters . _ - are allowed';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 12) {
      errors.password = 'Password must be at least 12 characters';
    }

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email address format';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
    if (confirmEmptyRoles) {
      setConfirmEmptyRoles(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setFieldErrors({});

    if (!validate()) {
      return;
    }

    // Check if roleIds is empty and user has not confirmed yet
    if (selectedRoleIds.length === 0 && !confirmEmptyRoles) {
      setConfirmEmptyRoles(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateUserDto = {
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        employmentStatus,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(employeeCode.trim() ? { employeeCode: employeeCode.trim() } : {}),
        ...(department.trim() ? { department: department.trim() } : {}),
        ...(hireDate ? { hireDate } : {}),
        ...(selectedRoleIds.length > 0 ? { roleIds: selectedRoleIds } : {}),
      };

      await api.post('/users', payload);
      toast.success('Employee account created successfully!');
      onSuccess();

      // Show credentials summary dialog so admin can copy credentials
      setCreatedSummary({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
      });
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      const details = e?.response?.data?.details;

      if (serverCode === 'DUPLICATE_RESOURCE' && details?.fields) {
        const errors: Record<string, string> = {};
        for (const f of details.fields) {
          if (f === 'username') errors.username = 'This username is already taken';
          if (f === 'email') errors.email = 'This email is already in use';
          if (f === 'employeeCode')
            errors.employeeCode = 'This employee code is already in use';
        }
        setFieldErrors(errors);
        setErrorMsg('Duplicate information detected. Please check the highlighted fields.');
      } else {
        setErrorMsg(
          e?.response?.data?.message ||
            'An error occurred while creating the employee. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Add New Employee
          </DialogTitle>
          <DialogDescription>
            Create user account, set initial password, and configure permissions.
          </DialogDescription>
        </DialogHeader>

        {createdSummary ? (
          <DialogBody className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Check className="size-5 text-emerald-500" />
                Account created successfully for {createdSummary.fullName}!
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The system <strong>does not send emails</strong> containing initial passwords. Please copy the credentials below to deliver directly or send through a secure channel. The employee will be required to change password on first login.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground font-sans">Username:</span>
                <span className="font-bold text-foreground text-sm">
                  {createdSummary.username}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground font-sans">Initial Password:</span>
                <span className="font-bold text-primary text-sm tracking-wider">
                  {createdSummary.password}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-sans">Password Change Status:</span>
                <span className="text-amber-500 font-sans font-medium">
                  Required on first login
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  const info = `Username: ${createdSummary.username}\nInitial Password: ${createdSummary.password}\n(Note: Required to change password upon first login)`;
                  copyToClipboard(info);
                }}
                className="gap-1.5"
              >
                {isCopied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
                {isCopied ? 'Copied' : 'Copy Credentials'}
              </Button>
              <Button onClick={() => handleClose(false)}>
                Done & Close
              </Button>
            </div>
          </DialogBody>
        ) : (
          <>
            <DialogBody className="space-y-4 py-2">
              {/* Important Admin Note */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Password Delivery Note:</strong> The administrator sets the initial password and provides it directly to the employee. The system does not email passwords for security compliance.
                </div>
              </div>

              {/* Account Credentials Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: '' }));
                      }
                    }}
                    placeholder="e.g. jdoe"
                    className={`font-mono text-xs h-9 ${
                      fieldErrors.username ? 'border-destructive focus-visible:ring-destructive/30' : ''
                    }`}
                    disabled={isSubmitting}
                  />
                  {fieldErrors.username ? (
                    <span className="text-[11px] text-destructive">
                      {fieldErrors.username}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      3-50 chars: letters, numbers, and . _ -
                    </span>
                  )}
                </div>

                {/* Password with generator & real-time counter */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setPassword(generateStrongPassword())}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      title="Generate strong random password"
                    >
                      <Wand2 className="size-3" /> Generate
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: '' }));
                        }
                      }}
                      placeholder="Minimum 12 characters"
                      className={`font-mono text-xs h-9 pe-16 ${
                        fieldErrors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''
                      }`}
                      disabled={isSubmitting}
                    />
                    <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded"
                      >
                        {showPassword ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    {fieldErrors.password ? (
                      <span className="text-destructive">{fieldErrors.password}</span>
                    ) : (
                      <span className="text-muted-foreground">Minimum 12 characters</span>
                    )}
                    <span
                      className={`font-mono font-medium ${
                        password.length >= 12
                          ? 'text-emerald-500'
                          : password.length > 0
                          ? 'text-amber-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {password.length}/12 chars
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
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
                    placeholder="e.g. John Doe"
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
                    placeholder="jdoe@example.com"
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
                    placeholder="EMP001"
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
                    placeholder="Sales, Engineering, HR..."
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

                {/* Employment Status */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Employment Status</Label>
                  <Select
                    value={employmentStatus}
                    onValueChange={(val) =>
                      setEmploymentStatus(val as EmploymentStatus)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Roles Selection */}
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/20 border border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider">
                    Initial Role Assignment
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedRoleIds.length} role(s) selected
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Assigning roles now is recommended. Accounts without roles will see an empty navigation menu.
                </p>

                {isLoadingRoles ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading roles...
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic py-1">
                    No roles found in the system.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {roles.map((role) => {
                      const isSelected = selectedRoleIds.includes(role.id);
                      return (
                        <div
                          key={role.id}
                          onClick={() => toggleRole(role.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-foreground'
                              : 'bg-background hover:bg-muted/50 border-border text-muted-foreground'
                          }`}
                        >
                          <div
                            className={`size-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-input bg-background'
                            }`}
                          >
                            {isSelected && <Check className="size-3" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {formatRoleName(role.name)}
                            </span>
                            {role.description && (
                              <span className="text-[10px] text-muted-foreground line-clamp-1">
                                {role.description}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Empty roles warning alert before submission */}
              {confirmEmptyRoles && (
                <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                    No roles assigned to this employee!
                  </div>
                  <p>
                    An account without roles can still log in, but will have an empty menu and cannot perform any work. Are you sure you want to create this account without any roles?
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setConfirmEmptyRoles(false)}
                    >
                      Back to Select Roles
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      Create Anyway
                    </Button>
                  </div>
                </div>
              )}

              {/* General Error Message */}
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
                Create Employee
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
