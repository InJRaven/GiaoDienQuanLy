import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Landmark,
  Loader2,
  MapPin,
  Phone,
  ShieldAlert,
  UserPlus,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { useApiQuery } from '@/hooks/use-api-query';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUserSchema } from '../schemas';
import {
  CreateUserDto,
  EmploymentStatus,
  formatRoleName,
  PositionOption,
  UserRole,
} from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function formatSalaryVND(salaryStr?: string | null): string {
  if (!salaryStr) return '';
  const num = Number(salaryStr);
  if (isNaN(num)) return salaryStr;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
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
  const [positionId, setPositionId] = useState<string>('');
  const [hireDate, setHireDate] = useState('');
  const [employmentStatus, setEmploymentStatus] =
    useState<EmploymentStatus>('active');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Profile fields (Thông tin cá nhân)
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [showProfileFields, setShowProfileFields] = useState(false);

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

  // Fetch available positions
  const { data: positions = [], isLoading: isLoadingPositions } = useApiQuery<
    PositionOption[]
  >(['users', 'positions'], '/users/positions', {
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
    setPositionId('');
    setHireDate('');
    setEmploymentStatus('active');
    setSelectedRoleIds([]);
    setPhone('');
    setAvatarUrl('');
    setIdCardNumber('');
    setDateOfBirth('');
    setAddress('');
    setBankAccount('');
    setBankName('');
    setShowProfileFields(false);
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
    const cleanBankAccount = bankAccount.replace(/[\s-]+/g, '');
    const hasProfileData = Boolean(
      phone.trim() ||
      avatarUrl.trim() ||
      idCardNumber.trim() ||
      dateOfBirth.trim() ||
      address.trim() ||
      cleanBankAccount ||
      bankName.trim(),
    );

    const profile = hasProfileData
      ? {
          phone: phone.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          idCardNumber: idCardNumber.trim() || undefined,
          dateOfBirth: dateOfBirth.trim() || undefined,
          address: address.trim() || undefined,
          bankAccount: cleanBankAccount || undefined,
          bankName: bankName.trim() || undefined,
        }
      : undefined;

    const result = createUserSchema.safeParse({
      username,
      password,
      fullName,
      email: email.trim() || undefined,
      employeeCode: employeeCode.trim() || undefined,
      department: department.trim() || undefined,
      positionId: positionId ? Number(positionId) : undefined,
      hireDate: hireDate.trim() || undefined,
      employmentStatus,
      roleIds: selectedRoleIds,
      profile,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName =
          (issue.path[issue.path.length - 1] as string) ||
          (issue.path[0] as string);
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);

      if (
        errors.phone ||
        errors.avatarUrl ||
        errors.idCardNumber ||
        errors.dateOfBirth ||
        errors.address ||
        errors.bankAccount ||
        errors.bankName
      ) {
        setShowProfileFields(true);
      }
      return false;
    }

    setFieldErrors({});
    return true;
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
      const cleanBankAccount = bankAccount.replace(/[\s-]+/g, '');
      const hasProfileData = Boolean(
        phone.trim() ||
        avatarUrl.trim() ||
        idCardNumber.trim() ||
        dateOfBirth.trim() ||
        address.trim() ||
        cleanBankAccount ||
        bankName.trim(),
      );

      const profilePayload = hasProfileData
        ? {
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
            ...(idCardNumber.trim()
              ? { idCardNumber: idCardNumber.trim() }
              : {}),
            ...(dateOfBirth.trim()
              ? { dateOfBirth: dateOfBirth.trim().substring(0, 10) }
              : {}),
            ...(address.trim() ? { address: address.trim() } : {}),
            ...(cleanBankAccount ? { bankAccount: cleanBankAccount } : {}),
            ...(bankName.trim() ? { bankName: bankName.trim() } : {}),
          }
        : undefined;

      const payload: CreateUserDto = {
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        employmentStatus,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(employeeCode.trim() ? { employeeCode: employeeCode.trim() } : {}),
        ...(department.trim() ? { department: department.trim() } : {}),
        ...(positionId ? { positionId: Number(positionId) } : {}),
        ...(hireDate ? { hireDate } : {}),
        ...(selectedRoleIds.length > 0 ? { roleIds: selectedRoleIds } : {}),
        ...(profilePayload ? { profile: profilePayload } : {}),
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
          if (f === 'username')
            errors.username = 'This username is already taken';
          if (f === 'email') errors.email = 'This email is already in use';
          if (f === 'employeeCode')
            errors.employeeCode = 'This employee code is already in use';
        }
        setFieldErrors(errors);
        setErrorMsg(
          'Duplicate information detected. Please check the highlighted fields.',
        );
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
            Create user account, set initial password, and configure
            permissions.
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
                The system <strong>does not send emails</strong> containing
                initial passwords. Please copy the credentials below to deliver
                directly or send through a secure channel. The employee will be
                required to change password on first login.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground font-sans">
                  Username:
                </span>
                <span className="font-bold text-foreground text-sm">
                  {createdSummary.username}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground font-sans">
                  Initial Password:
                </span>
                <span className="font-bold text-primary text-sm tracking-wider">
                  {createdSummary.password}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-sans">
                  Password Change Status:
                </span>
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
              <Button onClick={() => handleClose(false)}>Done & Close</Button>
            </div>
          </DialogBody>
        ) : (
          <>
            <DialogBody className="space-y-4 py-2">
              {/* Important Admin Note */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <ShieldAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Password Delivery Note:</strong> The administrator
                  sets the initial password and provides it directly to the
                  employee. The system does not email passwords for security
                  compliance.
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
                      setUsername(
                        e.target.value.toLowerCase().replace(/\s+/g, ''),
                      );
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: '' }));
                      }
                    }}
                    placeholder="e.g. jdoe"
                    className={`font-mono text-xs h-9 ${
                      fieldErrors.username
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : ''
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
                        fieldErrors.password
                          ? 'border-destructive focus-visible:ring-destructive/30'
                          : ''
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
                      <span className="text-destructive">
                        {fieldErrors.password}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Minimum 12 characters
                      </span>
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
                      fieldErrors.fullName
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : ''
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
                      fieldErrors.email
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : ''
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
                        setFieldErrors((prev) => ({
                          ...prev,
                          employeeCode: '',
                        }));
                      }
                    }}
                    placeholder="EMP001"
                    className={`font-mono text-xs h-9 ${
                      fieldErrors.employeeCode
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : ''
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

                {/* Position / Chức vụ */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">
                    Chức vụ (Position)
                  </Label>
                  <Select
                    value={positionId || 'none'}
                    onValueChange={(val) =>
                      setPositionId(val === 'none' ? '' : val)
                    }
                    disabled={isSubmitting || isLoadingPositions}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Chọn chức vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        -- Chưa chọn chức vụ --
                      </SelectItem>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={String(pos.id)}>
                          <div className="flex items-center gap-2">
                            <span>{pos.name}</span>
                            {pos.defaultSalary && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                ({formatSalaryVND(pos.defaultSalary)})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label className="text-xs font-semibold">
                    Employment Status
                  </Label>
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

              {/* Personal Profile Section (Collapsible) */}
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowProfileFields((prev) => !prev)}
                  className="w-full p-3.5 bg-muted/20 hover:bg-muted/30 transition-colors flex items-center justify-between text-start cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                      <CreditCard className="size-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Hồ sơ cá nhân (Tùy chọn)
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Số điện thoại, CCCD/CMND, ngày sinh, địa chỉ và tài
                        khoản ngân hàng
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{showProfileFields ? 'Thu gọn' : 'Mở rộng'}</span>
                    {showProfileFields ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                </button>

                {showProfileFields && (
                  <div className="p-4 space-y-4 border-t border-border bg-card">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">
                          Số điện thoại
                        </Label>
                        <div className="relative">
                          <Phone className="size-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2" />
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="vd: 0912345678 hoặc +84..."
                            className={`h-9 text-xs ps-8 ${
                              fieldErrors.phone
                                ? 'border-destructive focus-visible:ring-destructive/30'
                                : ''
                            }`}
                            disabled={isSubmitting}
                          />
                        </div>
                        {fieldErrors.phone && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.phone}
                          </span>
                        )}
                      </div>

                      {/* Date of Birth */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">
                          Ngày sinh
                        </Label>
                        <Input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className={`h-9 text-xs font-mono ${
                            fieldErrors.dateOfBirth
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.dateOfBirth && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.dateOfBirth}
                          </span>
                        )}
                      </div>

                      {/* ID Card Number */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">
                          Số CMND / CCCD
                        </Label>
                        <Input
                          value={idCardNumber}
                          onChange={(e) =>
                            setIdCardNumber(e.target.value.trim())
                          }
                          placeholder="Đúng 9 hoặc 12 chữ số"
                          maxLength={12}
                          className={`font-mono text-xs h-9 ${
                            fieldErrors.idCardNumber
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.idCardNumber && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.idCardNumber}
                          </span>
                        )}
                      </div>

                      {/* Avatar URL */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">
                          Link ảnh đại diện (Avatar URL)
                        </Label>
                        <div className="relative">
                          <ImageIcon className="size-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2" />
                          <Input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://.../avatar.jpg"
                            className={`h-9 text-xs ps-8 ${
                              fieldErrors.avatarUrl
                                ? 'border-destructive focus-visible:ring-destructive/30'
                                : ''
                            }`}
                            disabled={isSubmitting}
                          />
                        </div>
                        {fieldErrors.avatarUrl && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.avatarUrl}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold">
                        Địa chỉ thường trú / liên hệ
                      </Label>
                      <div className="relative">
                        <MapPin className="size-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                          className={`h-9 text-xs ps-8 ${
                            fieldErrors.address
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                      </div>
                      {fieldErrors.address && (
                        <span className="text-[11px] text-destructive">
                          {fieldErrors.address}
                        </span>
                      )}
                    </div>

                    {/* Bank Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      {/* Bank Name */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">
                          Tên ngân hàng
                        </Label>
                        <div className="relative">
                          <Landmark className="size-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2" />
                          <Input
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="vd: Techcombank, Vietcombank..."
                            className={`h-9 text-xs ps-8 ${
                              fieldErrors.bankName
                                ? 'border-destructive focus-visible:ring-destructive/30'
                                : ''
                            }`}
                            disabled={isSubmitting}
                          />
                        </div>
                        {fieldErrors.bankName && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.bankName}
                          </span>
                        )}
                      </div>

                      {/* Bank Account */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">
                          Số tài khoản ngân hàng
                        </Label>
                        <Input
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="Chỉ gồm chữ số (6-30 ký tự)"
                          className={`font-mono text-xs h-9 ${
                            fieldErrors.bankAccount
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.bankAccount && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.bankAccount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                  Assigning roles now is recommended. Accounts without roles
                  will see an empty navigation menu.
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
                    An account without roles can still log in, but will have an
                    empty menu and cannot perform any work. Are you sure you
                    want to create this account without any roles?
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
