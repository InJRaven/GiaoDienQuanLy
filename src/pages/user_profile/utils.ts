/**
 * Utility functions for user profile rendering, masking, currency formatting, and user-agent parsing.
 */

// Palette of deterministic colors based on user ID
const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
  'bg-cyan-500 text-white',
  'bg-teal-500 text-white',
  'bg-orange-500 text-white',
  'bg-pink-500 text-white',
];

export function getAvatarColor(id: number | string | undefined | null): string {
  if (id === undefined || id === null) return AVATAR_COLORS[0];
  const numericId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  const index = Math.abs(numericId) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mask sensitive numbers like CMND/CCCD and Bank Account.
 * Example: "123456789" -> "••••• 6789"
 */
export function maskSensitiveNumber(
  val?: string | null,
  visibleDigits = 4,
): string {
  if (!val) return '—';
  const clean = String(val).trim();
  if (clean.length <= visibleDigits) return clean;
  const maskedLength = Math.max(clean.length - visibleDigits, 4);
  const mask = '•'.repeat(maskedLength);
  const visible = clean.slice(-visibleDigits);
  return `${mask} ${visible}`;
}

/**
 * Format reference salary without parseFloat (to preserve precision on NUMERIC strings).
 * Example: "15000000.00" -> "15.000.000 ₫"
 */
export function formatVndString(salaryStr?: string | null): string {
  if (!salaryStr) return '';
  const trimmed = String(salaryStr).trim();
  if (!trimmed) return '';

  // Separate integer and decimal part if exists
  const [intPart] = trimmed.split('.');
  // Add thousand dots from right to left
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedInt} ₫`;
}

/**
 * Parse browser & OS from User-Agent string.
 */
export function parseUserAgent(ua: string): {
  browser: string;
  os: string;
} {
  if (!ua) return { browser: 'Trình duyệt không xác định', os: 'Hệ điều hành' };

  let os = 'Không xác định';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Trình duyệt';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Apple Safari';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  return { browser, os };
}

/**
 * Format date or epoch time to Vietnamese format
 */
export function formatDateTime(dateInput?: string | number | null): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
    return dateStr;
  } catch {
    return dateStr;
  }
}
