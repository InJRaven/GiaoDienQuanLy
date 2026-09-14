import { useEffect, useState } from 'react';
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
  Edit3,
  Loader2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Phone,
  CreditCard,
  MapPin,
  Building,
  Landmark,
  Image as ImageIcon,
} from 'lucide-react';
import { PositionOption, UpdateUserDto, UserListItem } from '../types';
import { updateUserSchema } from '../schemas';

interface Props {
  user: UserListItem | null;
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

export function UserEditDialog({ user, open, onOpenChange, onSuccess }: Props) {
  // Basic user fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');
  const [positionId, setPositionId] = useState<string>('');
  const [hireDate, setHireDate] = useState('');

  // Profile fields
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');

  // Profile visibility permission & collapse state
  const [hasProfilePermission, setHasProfilePermission] = useState(false);
  const [showProfileFields, setShowProfileFields] = useState(true);
  const [detailedUser, setDetailedUser] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch available positions
  const { data: positions = [] } = useApiQuery<PositionOption[]>(
    ['users', 'positions'],
    '/users/positions',
    {
      enabled: open,
      staleTime: 5 * 60 * 1000,
    },
  );

  useEffect(() => {
    if (user && open) {
      setErrorMsg('');
      setFieldErrors({});
      setIsLoadingDetail(true);

      api
        .get(`/users/${user.id}`)
        .then((res) => {
          const data = res.data;
          setDetailedUser(data);
          setFullName(data.fullName || '');
          setEmail(data.email || '');
          setEmployeeCode(data.employeeCode || '');
          setDepartment(data.department || '');
          setPositionId(data.positionId ? String(data.positionId) : '');
          setHireDate(
            data.hireDate ? data.hireDate.substring(0, 10) : '',
          );

          // Check if profile key exists in response (Section 4.2 of specification)
          const hasPerm = 'profile' in data;
          setHasProfilePermission(hasPerm);

          if (hasPerm && data.profile) {
            setPhone(data.profile.phone || '');
            setAvatarUrl(data.profile.avatarUrl || '');
            setIdCardNumber(data.profile.idCardNumber || '');
            setDateOfBirth(
              data.profile.dateOfBirth
                ? data.profile.dateOfBirth.substring(0, 10)
                : '',
            );
            setAddress(data.profile.address || '');
            setBankAccount(data.profile.bankAccount || '');
            setBankName(data.profile.bankName || '');
          } else {
            setPhone('');
            setAvatarUrl('');
            setIdCardNumber('');
            setDateOfBirth('');
            setAddress('');
            setBankAccount('');
            setBankName('');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch user details:', err);
          // Fallback to table row data
          setFullName(user.fullName || '');
          setEmail(user.email || '');
          setEmployeeCode(user.employeeCode || '');
          setDepartment(user.department || '');
          setHireDate(user.hireDate ? user.hireDate.substring(0, 10) : '');
          setHasProfilePermission(false);
        })
        .finally(() => {
          setIsLoadingDetail(false);
        });
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!user) return;
    setErrorMsg('');
    setFieldErrors({});

    const cleanBankAccount = bankAccount.replace(/[\s-]+/g, '');

    const profileData = hasProfilePermission
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

    const result = updateUserSchema.safeParse({
      fullName,
      email: email.trim() || undefined,
      employeeCode: employeeCode.trim() || undefined,
      department: department.trim() || undefined,
      positionId: positionId ? Number(positionId) : null,
      hireDate: hireDate.trim() || undefined,
      profile: profileData,
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
      return;
    }

    // Compute diff: send only changed fields, send null if cleared, omit if unchanged
    const payload: UpdateUserDto = {};
    let hasChanges = false;

    const trimmedFullName = fullName.trim();
    if (trimmedFullName !== (detailedUser?.fullName || '')) {
      payload.fullName = trimmedFullName;
      hasChanges = true;
    }

    const trimmedEmail = email.trim();
    const origEmail = detailedUser?.email || '';
    if (trimmedEmail !== origEmail) {
      payload.email = trimmedEmail ? trimmedEmail : null;
      hasChanges = true;
    }

    const trimmedEmpCode = employeeCode.trim();
    const origEmpCode = detailedUser?.employeeCode || '';
    if (trimmedEmpCode !== origEmpCode) {
      payload.employeeCode = trimmedEmpCode ? trimmedEmpCode : null;
      hasChanges = true;
    }

    const trimmedDept = department.trim();
    const origDept = detailedUser?.department || '';
    if (trimmedDept !== origDept) {
      payload.department = trimmedDept ? trimmedDept : null;
      hasChanges = true;
    }

    const newPosId = positionId ? Number(positionId) : null;
    const origPosId = detailedUser?.positionId || null;
    if (newPosId !== origPosId) {
      payload.positionId = newPosId;
      hasChanges = true;
    }

    const trimmedHireDate = hireDate.trim() ? hireDate.trim().substring(0, 10) : '';
    const origHireDate = detailedUser?.hireDate
      ? detailedUser.hireDate.substring(0, 10)
      : '';
    if (trimmedHireDate !== origHireDate) {
      payload.hireDate = trimmedHireDate ? trimmedHireDate : null;
      hasChanges = true;
    }

    // Compute profile diff if permission allowed
    if (hasProfilePermission) {
      const origProfile = detailedUser?.profile || {};
      const dirtyProfile: Record<string, any> = {};

      const newPhone = phone.trim() || null;
      const origPhone = origProfile.phone || null;
      if (newPhone !== origPhone) dirtyProfile.phone = newPhone;

      const newAvatar = avatarUrl.trim() || null;
      const origAvatar = origProfile.avatarUrl || null;
      if (newAvatar !== origAvatar) dirtyProfile.avatarUrl = newAvatar;

      const newIdCard = idCardNumber.trim() || null;
      const origIdCard = origProfile.idCardNumber || null;
      if (newIdCard !== origIdCard) dirtyProfile.idCardNumber = newIdCard;

      const newDob = dateOfBirth.trim()
        ? dateOfBirth.trim().substring(0, 10)
        : null;
      const origDob = origProfile.dateOfBirth
        ? origProfile.dateOfBirth.substring(0, 10)
        : null;
      if (newDob !== origDob) dirtyProfile.dateOfBirth = newDob;

      const newAddress = address.trim() || null;
      const origAddress = origProfile.address || null;
      if (newAddress !== origAddress) dirtyProfile.address = newAddress;

      const newBankAcc = cleanBankAccount || null;
      const origBankAcc = origProfile.bankAccount || null;
      if (newBankAcc !== origBankAcc) dirtyProfile.bankAccount = newBankAcc;

      const newBankName = bankName.trim() || null;
      const origBankName = origProfile.bankName || null;
      if (newBankName !== origBankName) dirtyProfile.bankName = newBankName;

      if (Object.keys(dirtyProfile).length > 0) {
        payload.profile = dirtyProfile;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      toast.info('Không có thay đổi nào để cập nhật');
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/users/${user.id}`, payload);
      toast.success('Cập nhật thông tin nhân viên thành công!');
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      const serverCode = e?.response?.data?.code;
      const details = e?.response?.data?.details;

      if (serverCode === 'DUPLICATE_RESOURCE' && details?.fields) {
        const errs: Record<string, string> = {};
        for (const f of details.fields) {
          if (f === 'email')
            errs.email = 'Email này đã được sử dụng bởi nhân viên khác';
          if (f === 'employeeCode')
            errs.employeeCode = 'Mã nhân viên này đã tồn tại trong hệ thống';
        }
        setFieldErrors(errs);
        setErrorMsg('Dữ liệu trùng lặp với nhân viên khác.');
      } else {
        setErrorMsg(
          e?.response?.data?.message ||
            'Đã xảy ra lỗi khi cập nhật thông tin nhân viên.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const selectedPosition = positions.find(
    (p) => String(p.id) === String(positionId),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5 text-primary" />
            Sửa thông tin nhân viên
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin công việc và hồ sơ cá nhân của nhân viên. Chỉ các trường thay đổi sẽ được gửi lên hệ thống.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 px-6 py-2 overflow-y-auto">
          {isLoadingDetail ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs">Đang tải thông tin chi tiết nhân viên...</p>
            </div>
          ) : (
            <>
              {/* Read-only Username banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Tên đăng nhập (Bất biến)
                  </span>
                  <span className="font-mono font-bold text-sm text-foreground">
                    {user.username}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground italic">
                  <Info className="size-3.5 shrink-0" />
                  Cố định theo quy định bảo mật
                </div>
              </div>

              {/* Thông tin công việc */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Thông tin công việc
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-xs font-semibold">
                      Họ và tên <span className="text-destructive">*</span>
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
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-semibold">Địa chỉ Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: '' }));
                        }
                      }}
                      placeholder="Để trống nếu muốn xoá email"
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
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-semibold">Mã nhân viên</Label>
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
                      placeholder="Để trống nếu muốn xoá mã"
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
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-semibold">Phòng ban</Label>
                    <Input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="VD: Kinh doanh, Kỹ thuật..."
                      className="h-9 text-xs"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Position Dropdown */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-semibold">Chức vụ</Label>
                    <Select
                      value={positionId || 'none'}
                      onValueChange={(val) =>
                        setPositionId(val === 'none' ? '' : val)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Chọn chức vụ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          -- Chưa phân chức vụ --
                        </SelectItem>
                        {positions.map((pos) => (
                          <SelectItem
                            key={pos.id}
                            value={String(pos.id)}
                            className="text-xs"
                          >
                            {pos.name}
                            {pos.defaultSalary && (
                              <span className="ml-2 text-[11px] text-muted-foreground font-mono">
                                ({formatSalaryVND(pos.defaultSalary)})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPosition?.defaultSalary && (
                      <span className="text-[11px] text-muted-foreground italic">
                        Mức lương tham khảo của chức vụ:{' '}
                        <strong className="text-foreground">
                          {formatSalaryVND(selectedPosition.defaultSalary)}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Hire Date */}
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-xs font-semibold">Ngày vào làm</Label>
                    <Input
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="h-9 text-xs font-mono max-w-xs"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin cá nhân (Profile) - Conditionally shown ONLY if 'profile' in user */}
              {hasProfilePermission ? (
                <div className="pt-2 border-t border-border space-y-3">
                  <div
                    onClick={() => setShowProfileFields((prev) => !prev)}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border cursor-pointer select-none hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        Hồ sơ cá nhân & Ngân hàng
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        (user_profiles:view_private)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 p-0 text-muted-foreground"
                    >
                      {showProfileFields ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  </div>

                  {showProfileFields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-card border border-border">
                      {/* Phone */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" />
                          Số điện thoại
                        </Label>
                        <Input
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (fieldErrors.phone) {
                              setFieldErrors((prev) => ({ ...prev, phone: '' }));
                            }
                          }}
                          placeholder="09... hoặc +84..."
                          className={`h-9 text-xs font-mono ${
                            fieldErrors.phone
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.phone && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.phone}
                          </span>
                        )}
                      </div>

                      {/* Avatar URL */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <ImageIcon className="size-3.5 text-muted-foreground" />
                          Ảnh đại diện (URL)
                        </Label>
                        <Input
                          value={avatarUrl}
                          onChange={(e) => {
                            setAvatarUrl(e.target.value);
                            if (fieldErrors.avatarUrl) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                avatarUrl: '',
                              }));
                            }
                          }}
                          placeholder="https://.../avatar.jpg"
                          className={`h-9 text-xs ${
                            fieldErrors.avatarUrl
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.avatarUrl && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.avatarUrl}
                          </span>
                        )}
                      </div>

                      {/* ID Card / CCCD */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <CreditCard className="size-3.5 text-muted-foreground" />
                          Số CCCD / CMND
                        </Label>
                        <Input
                          value={idCardNumber}
                          onChange={(e) => {
                            setIdCardNumber(e.target.value);
                            if (fieldErrors.idCardNumber) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                idCardNumber: '',
                              }));
                            }
                          }}
                          placeholder="Đúng 9 hoặc 12 chữ số"
                          maxLength={12}
                          className={`h-9 text-xs font-mono ${
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

                      {/* Date of Birth */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-semibold">
                          Ngày sinh
                        </Label>
                        <Input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => {
                            setDateOfBirth(e.target.value);
                            if (fieldErrors.dateOfBirth) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                dateOfBirth: '',
                              }));
                            }
                          }}
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

                      {/* Address */}
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          Địa chỉ thường trú / liên hệ
                        </Label>
                        <Input
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            if (fieldErrors.address) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                address: '',
                              }));
                            }
                          }}
                          placeholder="Địa chỉ số nhà, đường, phường/xã, quận/huyện..."
                          className={`h-9 text-xs ${
                            fieldErrors.address
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.address && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.address}
                          </span>
                        )}
                      </div>

                      {/* Bank Account */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Building className="size-3.5 text-muted-foreground" />
                          Số tài khoản ngân hàng
                        </Label>
                        <Input
                          value={bankAccount}
                          onChange={(e) => {
                            setBankAccount(e.target.value);
                            if (fieldErrors.bankAccount) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                bankAccount: '',
                              }));
                            }
                          }}
                          placeholder="Chỉ số (6 - 30 ký tự số)"
                          className={`h-9 text-xs font-mono ${
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

                      {/* Bank Name */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Landmark className="size-3.5 text-muted-foreground" />
                          Tên ngân hàng
                        </Label>
                        <Input
                          value={bankName}
                          onChange={(e) => {
                            setBankName(e.target.value);
                            if (fieldErrors.bankName) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                bankName: '',
                              }));
                            }
                          }}
                          placeholder="VD: Vietcombank, Techcombank, MB..."
                          className={`h-9 text-xs ${
                            fieldErrors.bankName
                              ? 'border-destructive focus-visible:ring-destructive/30'
                              : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.bankName && (
                          <span className="text-[11px] text-destructive">
                            {fieldErrors.bankName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter className="p-6 pt-3 flex gap-2 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingDetail}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
