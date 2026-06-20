import * as XLSX from 'xlsx';

const TEMPLATE_COLUMNS = [
  'customer_name',
  'customer_alias',
  'state',
  'city',
  'tender_number',
  'tender_name',
  'requirement_type',
  'eligible',
  'tender_publish_date',
  'pre_bid_date',
  'due_date',
  'submission_end_date',
  'estimated_value',
  'contract_year',
  'contract_month',
  'ra',
  'emd',
  'epbg',
  'epbg_value',
  'tender_fees',
  'product_name',
  'oem_name',
  'quantity',
  'oic_name',
  'remarks',
  'created_date',
  'current_stage',
  'status',
];

const SAMPLE_ROW = {
  customer_name: 'Demo Customer Pvt Ltd',
  customer_alias: 'DCPL',
  state: 'Rajasthan',
  city: 'Jaipur',
  tender_number: 'TN-2026-001',
  tender_name: 'Cloud Infrastructure Upgrade',
  requirement_type: 'Cloud',
  eligible: 'yes',
  tender_publish_date: '2026-06-10',
  pre_bid_date: '2026-06-18',
  due_date: '2026-06-25',
  submission_end_date: '2026-06-25',
  estimated_value: 2500000,
  contract_year: 2,
  contract_month: 0,
  ra: 'Yes',
  emd: 'Yes',
  epbg: 'Yes',
  epbg_value: '5%',
  tender_fees: '2500',
  product_name: 'Azure Subscription',
  oem_name: 'Microsoft',
  quantity: 1,
  oic_name: 'Surbhi OIC',
  remarks: 'Sample row; remove before upload.',
  created_date: '2026-06-12',
  current_stage: 'New / Identified',
  status: 'Bucket-Active',
};

const NOTES = [
  {
    Field: 'Dates',
    Rule: 'Use YYYY-MM-DD or DD-MM-YYYY',
  },
  {
    Field: 'RA',
    Rule: 'Enter: Yes or No',
  },
  {
    Field: 'EMD',
    Rule: 'Enter: Yes, No, or Exemption',
  },
  {
    Field: 'ePBG',
    Rule: 'Enter: Yes or No',
  },
  {
    Field: 'ePBG Value (%)',
    Rule: 'Enter numeric value with or without % (e.g., 5 or 5%)',
  },
  {
    Field: 'Allowed current_stage',
    Rule: 'New / Identified, Bid Submitted, Under Evaluation, Negotiation, Won, Lost',
  },
  {
    Field: 'Allowed status',
    Rule: 'Bucket-Active, Bucket-Cold, Ongoing-Active, Submitted, Won, Lost, Drop, Archived',
  },
  {
    Field: 'Deduplication',
    Rule: 'Duplicate tender_number is not allowed. If tender_number is empty, a composite duplicate check is applied.',
  },
  {
    Field: 'Important',
    Rule: 'If any row has an error, nothing will be uploaded.',
  },
];

export function generateBulkUploadTemplate(): void {
  const workbook = XLSX.utils.book_new();

  const sheetRows = [
    TEMPLATE_COLUMNS,
    TEMPLATE_COLUMNS.map((col) => (SAMPLE_ROW as Record<string, any>)[col] ?? ''),
  ];
  const templateSheet = XLSX.utils.aoa_to_sheet(sheetRows);

  templateSheet['!cols'] = TEMPLATE_COLUMNS.map((column) => ({
    wch: Math.max(14, column.length + 4),
  }));

  XLSX.utils.book_append_sheet(workbook, templateSheet, 'opportunities');

  const notesSheet = XLSX.utils.json_to_sheet(NOTES);
  notesSheet['!cols'] = [{ wch: 28 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(workbook, notesSheet, 'readme');

  XLSX.writeFile(workbook, 'SEPL_Sales_Funnel_Bulk_Upload_Template.xlsx');
}
