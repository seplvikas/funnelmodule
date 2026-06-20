import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, UploadCloud, X, XCircle } from 'lucide-react';
import { seplApi } from '../../services/api';
import { generateBulkUploadTemplate } from '../../utils/bulkUploadTemplate';
import { BulkUploadError, validateBulkUploadRows } from '../../utils/bulkUploadValidator';

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

interface PreviewRow {
  rowNumber: number;
  customer_name?: string;
  state?: string;
  city?: string;
  tender_number?: string;
  tender_name?: string;
  status?: string;
}

export function BulkUploadModal({ open, onClose, onUploaded }: BulkUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [normalizedRows, setNormalizedRows] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<BulkUploadError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const hasErrors = errors.length > 0;

  const groupedErrors = useMemo(() => {
    return errors.reduce<Record<number, BulkUploadError[]>>((acc, err) => {
      if (!acc[err.row]) acc[err.row] = [];
      acc[err.row].push(err);
      return acc;
    }, {});
  }, [errors]);

  const resetState = () => {
    setFileName('');
    setPreviewRows([]);
    setNormalizedRows([]);
    setErrors([]);
    setUploading(false);
    setResultMessage('');
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

    const validation = validateBulkUploadRows(rows);

    setPreviewRows(
      rows.map((row, index) => ({
        rowNumber: index + 2,
        customer_name: row.customer_name,
        state: row.state,
        city: row.city,
        tender_number: row.tender_number,
        tender_name: row.tender_name,
        status: row.status,
      }))
    );
    setNormalizedRows(validation.normalizedRows);
    setErrors(validation.errors);
  };

  const handleFileSelected = async (file?: File) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setErrors([{ row: 1, field: 'file', message: 'Only .xlsx or .xls files are allowed.' }]);
      return;
    }

    setFileName(file.name);
    setResultMessage('');

    try {
      await parseFile(file);
    } catch (err: any) {
      setErrors([{ row: 1, field: 'file', message: err?.message || 'Failed to parse Excel file.' }]);
      setPreviewRows([]);
      setNormalizedRows([]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const uploadFile = async () => {
    if (!normalizedRows.length || hasErrors) return;

    try {
      setUploading(true);
      setResultMessage('');

      const response = await seplApi.bulkUploadOpportunities(normalizedRows);
      const inserted = Number(response?.data?.inserted || 0);
      setResultMessage(`${inserted} opportunities uploaded successfully.`);
      setTimeout(() => {
        onUploaded();
        resetState();
      }, 900);
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        setErrors(backendErrors);
      } else {
        setErrors([{ row: 1, field: 'upload', message: err?.response?.data?.error || err?.message || 'Bulk upload failed.' }]);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/55 p-4 sm:p-6 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl rounded-2xl bg-white shadow-2xl border border-indigo-100">
        <div className="flex items-center justify-between rounded-t-2xl px-5 py-4 sm:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Bulk Upload Opportunities</h2>
              <p className="text-xs sm:text-sm text-indigo-100">Download template, fill data, upload in one shot.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-white/15 transition"
            aria-label="Close bulk upload"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generateBulkUploadTemplate}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              <Download className="h-4 w-4" />
              Download Excel Template
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <UploadCloud className="h-4 w-4" />
              Choose File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />

            {fileName && <span className="text-sm text-gray-600">File: {fileName}</span>}
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50'
            }`}
          >
            <UploadCloud className="h-8 w-8 text-indigo-500" />
            <p className="text-sm font-semibold text-gray-700">Drag and drop your Excel file here</p>
            <p className="text-xs text-gray-500">or click to browse (.xlsx, .xls)</p>
          </div>

          {resultMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm font-medium">
              {resultMessage}
            </div>
          )}

          {hasErrors && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-rose-700 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" />
                Validation errors found ({errors.length}). Upload is blocked until fixed.
              </div>
              <div className="max-h-40 overflow-auto space-y-1 pr-1">
                {Object.entries(groupedErrors).map(([row, rowErrors]) => (
                  <div key={row} className="text-xs text-rose-700">
                    Row {row}: {rowErrors.map((e) => `${e.field} - ${e.message}`).join(' | ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                Preview ({previewRows.length} rows)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">Customer</th>
                      <th className="px-3 py-2 text-left">State</th>
                      <th className="px-3 py-2 text-left">City</th>
                      <th className="px-3 py-2 text-left">Tender No.</th>
                      <th className="px-3 py-2 text-left">Tender Name</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => {
                      const rowHasError = !!groupedErrors[row.rowNumber]?.length;
                      return (
                        <tr key={`${row.rowNumber}-${index}`} className={rowHasError ? 'bg-rose-50' : 'bg-emerald-50'}>
                          <td className="px-3 py-2">{row.rowNumber}</td>
                          <td className="px-3 py-2">{row.customer_name || '-'}</td>
                          <td className="px-3 py-2">{row.state || '-'}</td>
                          <td className="px-3 py-2">{row.city || '-'}</td>
                          <td className="px-3 py-2">{row.tender_number || '-'}</td>
                          <td className="px-3 py-2">{row.tender_name || '-'}</td>
                          <td className="px-3 py-2">{row.status || 'Bucket-Active'}</td>
                          <td className="px-3 py-2">
                            {rowHasError ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold">
                                <XCircle className="h-4 w-4" />
                                Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                                <CheckCircle2 className="h-4 w-4" />
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={uploadFile}
              disabled={uploading || !normalizedRows.length || hasErrors}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transition"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Upload Valid Rows'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
