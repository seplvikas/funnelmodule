export const ALLOWED_STAGES = [
  'New / Identified',
  'Bid Submitted',
  'Under Evaluation',
  'Negotiation',
  'Won',
  'Lost',
];

export const ALLOWED_STATUSES = [
  'Bucket-Active',
  'Bucket-Cold',
  'Ongoing-Active',
  'Submitted',
  'Won',
  'Lost',
  'Drop',
  'Archived',
];

export interface BulkUploadError {
  row: number;
  field: string;
  message: string;
}

export interface BulkUploadValidationResult {
  normalizedRows: Record<string, any>[];
  errors: BulkUploadError[];
}

const NUMERIC_FIELDS = new Set([
  'estimated_value',
  'contract_year',
  'contract_month',
  'quantity',
]);

const RA_OPTIONS = ['Yes', 'No'];
const EMD_OPTIONS = ['Yes', 'No', 'Exemption'];

function normalizeCellValue(value: unknown): any {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return value;
}

function normalizeHeaderKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toDateString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const ddmmyyyy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const dt = new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]));
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString().split('T')[0];
  }

  const yyyymmdd = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const dt = new Date(Number(yyyymmdd[1]), Number(yyyymmdd[2]) - 1, Number(yyyymmdd[3]));
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString().split('T')[0];
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function duplicateKey(row: Record<string, any>): string {
  if (row.tender_number) return `tn:${String(row.tender_number).toLowerCase()}`;
  return [
    row.customer_name || '',
    row.tender_name || '',
    row.state || '',
    row.city || '',
    row.due_date || '',
  ]
    .map((part) => String(part).toLowerCase())
    .join('|');
}

export function validateBulkUploadRows(rows: Record<string, any>[]): BulkUploadValidationResult {
  const errors: BulkUploadError[] = [];
  const normalizedRows: Record<string, any>[] = [];
  const seen = new Set<string>();

  if (!rows.length) {
    return {
      normalizedRows: [],
      errors: [{ row: 1, field: 'file', message: 'No data rows found in sheet.' }],
    };
  }

  if (rows.length > 500) {
    return {
      normalizedRows: [],
      errors: [{ row: 1, field: 'file', message: 'Maximum 500 rows allowed in one upload.' }],
    };
  }

  rows.forEach((rawRow, index) => {
    const rowNo = index + 2;
    const row: Record<string, any> = {};

    Object.keys(rawRow).forEach((key) => {
      const normalizedKey = normalizeHeaderKey(key);
      row[normalizedKey] = normalizeCellValue(rawRow[key]);
    });

    const hasAnyIdentifier = !!(row.customer_name || row.tender_number || row.tender_name);
    if (!hasAnyIdentifier) {
      errors.push({
        row: rowNo,
        field: 'customer_name',
        message: 'Provide at least one of customer_name, tender_number, or tender_name.',
      });
    }

    ['tender_publish_date', 'pre_bid_date', 'due_date', 'submission_end_date', 'created_date'].forEach((field) => {
      if (row[field]) {
        const parsed = toDateString(row[field]);
        if (!parsed) {
          errors.push({ row: rowNo, field, message: 'Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY.' });
          return;
        }
        row[field] = parsed;
      }
    });

    NUMERIC_FIELDS.forEach((field) => {
      if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
        const parsed = Number(row[field]);
        if (!Number.isFinite(parsed)) {
          errors.push({ row: rowNo, field, message: 'Must be a numeric value.' });
          return;
        }
        row[field] = parsed;
      }
    });

    if (row.ra) {
      const raValue = String(row.ra).trim();
      if (!RA_OPTIONS.includes(raValue)) {
        errors.push({ row: rowNo, field: 'ra', message: `Must be: ${RA_OPTIONS.join(' or ')}` });
      } else {
        row.ra = raValue;
      }
    }

    if (row.emd) {
      const emdValue = String(row.emd).trim();
      if (!EMD_OPTIONS.includes(emdValue)) {
        errors.push({ row: rowNo, field: 'emd', message: `Must be: ${EMD_OPTIONS.join(', ')}` });
      } else {
        row.emd = emdValue;
      }
    }

    if (row.epbg) {
      const epbgValue = String(row.epbg).trim();
      if (!RA_OPTIONS.includes(epbgValue)) {
        errors.push({ row: rowNo, field: 'epbg', message: `Must be: ${RA_OPTIONS.join(' or ')}` });
      } else {
        row.epbg = epbgValue;
      }
    }

    if (row.epbg_value) {
      const epbgStr = String(row.epbg_value).trim().replace(/%$/, '');
      const epbgNum = Number(epbgStr);
      if (!Number.isFinite(epbgNum) || epbgNum < 0) {
        errors.push({ row: rowNo, field: 'epbg_value', message: 'Must be a non-negative number, with or without %' });
      } else {
        row.epbg_value = epbgStr;
      }
    }

    if (row.quantity !== null && row.quantity !== undefined && row.quantity < 0) {
      errors.push({ row: rowNo, field: 'quantity', message: 'Quantity cannot be negative.' });
    }

    if (row.current_stage && !ALLOWED_STAGES.includes(String(row.current_stage))) {
      errors.push({ row: rowNo, field: 'current_stage', message: `Invalid stage. Allowed: ${ALLOWED_STAGES.join(', ')}` });
    }

    if (row.status && !ALLOWED_STATUSES.includes(String(row.status))) {
      errors.push({ row: rowNo, field: 'status', message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    if (row.tender_publish_date) {
      const publish = new Date(row.tender_publish_date);
      ['pre_bid_date', 'due_date', 'submission_end_date'].forEach((field) => {
        if (row[field] && new Date(row[field]) < publish) {
          errors.push({ row: rowNo, field, message: `${field} cannot be earlier than tender_publish_date.` });
        }
      });
    }

    const key = duplicateKey(row);
    if (key.replace(/\|/g, '').trim().length === 0) {
      errors.push({ row: rowNo, field: 'tender_number', message: 'Insufficient data for duplicate check.' });
    } else if (seen.has(key)) {
      errors.push({ row: rowNo, field: 'tender_number', message: 'Duplicate row found in uploaded file.' });
    } else {
      seen.add(key);
    }

    normalizedRows.push(row);
  });

  return { normalizedRows, errors };
}
