const IST_TIME_ZONE = 'Asia/Kolkata';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
const HAS_TIME_ZONE_RE = /(Z|[+-]\d{2}:?\d{2})$/i;
const MIDNIGHT_WITH_TZ_RE = /^\d{4}-\d{2}-\d{2}[T ]00:00(?::00(?:\.0{1,3})?)?(?:Z|\+00:?00)$/i;
const MIDNIGHT_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}[ T]00:00(?::00(?:\.0{1,3})?)?$/;

export const isDateOnlyInput = (value: string): boolean => DATE_ONLY_RE.test(value.trim());

export const isDateOnlyLikeInput = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const input = String(value).trim();
  return DATE_ONLY_RE.test(input) || MIDNIGHT_WITH_TZ_RE.test(input) || MIDNIGHT_NO_TZ_RE.test(input);
};

export const parseDateInput = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const input = String(value).trim();
  if (!input) return null;

  let normalized = input;

  if (DATE_TIME_NO_TZ_RE.test(input) && !HAS_TIME_ZONE_RE.test(input)) {
    normalized = `${input.replace(' ', 'T')}Z`;
  } else if (DATE_ONLY_RE.test(input)) {
    normalized = `${input}T00:00:00Z`;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatWithParts = (
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] | null => {
  const date = parseDateInput(value);
  if (!date) return null;
  return new Intl.DateTimeFormat('en-IN', { timeZone: IST_TIME_ZONE, ...options }).formatToParts(date);
};

const pick = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string => {
  return parts.find((part) => part.type === type)?.value || '';
};

export const formatISTDate = (value: string | null | undefined, fallback = '-'): string => {
  const parts = formatWithParts(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  if (!parts) return fallback;
  return `${pick(parts, 'day')}-${pick(parts, 'month')}-${pick(parts, 'year')}`;
};

export const formatISTTime = (value: string | null | undefined, fallback = '-'): string => {
  if (!value) return fallback;
  if (isDateOnlyLikeInput(value)) return fallback;

  const parts = formatWithParts(value, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  if (!parts) return fallback;

  return `${pick(parts, 'hour')}:${pick(parts, 'minute')} ${pick(parts, 'dayPeriod').toUpperCase()}`;
};

export const formatISTDateTime = (value: string | null | undefined, fallback = '-'): string => {
  if (!value) return fallback;
  if (isDateOnlyLikeInput(value)) return formatISTDate(value, fallback);

  const parts = formatWithParts(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  if (!parts) return fallback;

  return `${pick(parts, 'day')}-${pick(parts, 'month')}-${pick(parts, 'year')} ${pick(parts, 'hour')}:${pick(parts, 'minute')} ${pick(parts, 'dayPeriod').toUpperCase()}`;
};
