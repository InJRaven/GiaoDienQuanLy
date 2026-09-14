export type CredentialStatus = 'unverified' | 'ok' | 'invalid';

export interface CourseraAccount {
  id: number;
  customerName: string;
  courseraAccount: string;
  hasPassword: boolean;
  password?: string | null; // Only present if user has customer_orders:view_credential
  passwordError?: boolean; // True if decryption failed on server
  credentialStatus: CredentialStatus;
  credentialCheckedAt?: string | null;
  credentialCheckedByName?: string | null;
  orderCount?: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderItem {
  id: number;
  accountId?: number;
  account: CourseraAccount;
  /** @deprecated Chuyển sang order.account.customerName theo mô hình 1-N mới */
  customerName?: string;
  /** @deprecated Chuyển sang order.account.courseraAccount theo mô hình 1-N mới */
  courseraAccount?: string;
  courseId: number;
  courseCode: string; // Course code (name column was removed from DB)
  price: string; // Database NUMERIC(12,2) string (e.g. "1500000.00")
  assignedUserId: number | null;
  assignedUserName: string | null;
  isCompleted: boolean;
  hasCertificate: boolean;
  isPaid: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerOrderListResponse {
  items: CustomerOrderItem[];
  pagination: CustomerOrderListPagination;
}

export interface CustomerAccountListResponse {
  items: CourseraAccount[];
  pagination: CustomerOrderListPagination;
}

export interface CreateOrderAccountPayload {
  customerName: string; // max 150
  courseraAccount: string; // max 255
  password?: string;
}

export interface CreateCustomerOrderBaseDto {
  courseId: number;
  price?: number; // max 2 decimals, >= 0
  assignedUserId?: number | null;
  isCompleted?: boolean;
  hasCertificate?: boolean;
  isPaid?: boolean;
  note?: string;
}

export type CreateCustomerOrderDto =
  | (CreateCustomerOrderBaseDto & { accountId: number })
  | (CreateCustomerOrderBaseDto & { account: CreateOrderAccountPayload });

export interface UpdateCustomerOrderDto {
  accountId?: number; // transfer order to another account
  courseId?: number;
  price?: number;
  assignedUserId?: number | null; // null unassigns user
  isCompleted?: boolean;
  hasCertificate?: boolean;
  isPaid?: boolean;
  note?: string;
}

export interface CreateCustomerAccountDto {
  customerName: string;
  courseraAccount: string;
  password?: string;
  note?: string;
}

export interface UpdateCustomerAccountDto {
  customerName?: string;
  courseraAccount?: string;
  password?: string | null; // null deletes stored password
  note?: string;
}

export interface CredentialCheckDto {
  status: 'ok' | 'invalid';
}

export interface AccountPasswordMismatchDetails {
  accountId: number;
  orderCount: number;
}

export interface AccountPasswordMismatchError {
  code: 'ACCOUNT_PASSWORD_MISMATCH';
  message: string;
  details: AccountPasswordMismatchDetails;
}

export type CustomerOrderSortBy = 'price' | 'created_at' | 'updated_at';

export type CustomerAccountSortBy =
  | 'customer_name'
  | 'coursera_account'
  | 'created_at'
  | 'updated_at'
  | 'credential_checked_at';

export interface SubjectOption {
  id: number;
  code: string;
}

export interface AssigneeOption {
  id: number;
  username: string;
  fullName?: string | null;
}

export type AccountActionType = 'create' | 'reuse' | 'fill-password';

export interface ImportPreviewItem {
  rowNumber: number;
  customerName: string;
  courseCode: string;
  courseraAccount: string;
  hasPassword: boolean;
  price?: string;
  assignee?: string;
  accountAction?: AccountActionType;
  status: 'ready' | 'duplicate' | 'invalid';
  warnings?: string[];
  errors?: string[];
}

export interface ImportSummary {
  totalRows: number;
  ready: number;
  duplicate: number;
  invalid: number;
  newAccounts?: number;
}

export interface ImportPreviewResponse {
  importId: string;
  expiresInSeconds: number;
  summary: ImportSummary;
  items: ImportPreviewItem[];
}

export interface ImportConfirmResultItem {
  rowNumber: number;
  customerName: string;
  status: 'created' | 'failed';
  id?: number;
  error?: string;
}

export interface ImportConfirmResponse {
  created: number;
  failed: number;
  accountsCreated?: number;
  items: ImportConfirmResultItem[];
}

/**
 * Format raw currency string from database into standard Vietnamese Dong string.
 * Keeps exact string precision without floating point conversion.
 * e.g. "1500000.00" -> "1.500.000 ₫"
 */
export function formatCurrencyVND(rawPrice?: string | null): string {
  if (!rawPrice) return '0 ₫';
  try {
    const parts = rawPrice.split('.');
    const integerPart = parts[0] || '0';
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInteger} ₫`;
  } catch {
    return `${rawPrice} ₫`;
  }
}
