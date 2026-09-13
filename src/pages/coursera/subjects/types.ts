export interface SubjectLink {
  id?: number;
  label?: string; // Tên phần / môn con (tối đa 100 ký tự)
  url: string; // Đường dẫn, tối đa 500, phải có http:// hoặc https://
  sortOrder?: number;
}

export interface SubjectItem {
  id: number;
  code: string; // 1–50 ký tự, [A-Za-z0-9._-] - Định danh & hiển thị duy nhất
  isActive: boolean; // Trạng thái: true (Đang nhận) / false (Đã ẩn)
  links: SubjectLink[];
  createdAt: string;
  updatedAt: string;
}

export interface SubjectPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SubjectListResponse {
  items: SubjectItem[];
  meta: SubjectPaginationMeta;
}

export interface CreateSubjectDto {
  code: string;
  links: Array<{ label?: string; url: string }>;
}

export interface UpdateSubjectDto {
  links?: Array<{ label?: string; url: string }>;
  isActive?: boolean;
}

export interface SubjectFilterParams {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'course_code' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: {
    resource?: string;
    fields?: string[];
  };
}

export interface ImportSummary {
  totalRows: number;
  courses: number;
  ready: number;
  duplicate: number;
  invalid: number;
}

export interface ImportPreviewItem {
  code: string;
  rows: number[];
  status: 'ready' | 'duplicate' | 'invalid';
  links: Array<{ label: string | null; url: string }>;
  errors?: string[];
}

export interface ImportPreviewResponse {
  importId: string;
  expiresInSeconds: number;
  summary: ImportSummary;
  items: ImportPreviewItem[];
}

export interface ImportConfirmResponse {
  created: number;
  failed: number;
  items: Array<{
    code: string;
    status: 'created' | 'failed';
    id?: number;
    error?: string;
  }>;
}
