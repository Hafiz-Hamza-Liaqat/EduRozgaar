import fs from 'fs';
import XLSX from 'xlsx';

/**
 * Parse uploaded file (JSON, CSV, or Excel) into an array of row objects.
 */
export function parseImportFile(filePath, originalName = '') {
  const ext = (originalName || filePath).split('.').pop()?.toLowerCase();

  let rows;
  if (ext === 'json') {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) rows = data;
    else if (Array.isArray(data.records)) rows = data.records;
    else if (Array.isArray(data.data)) rows = data.data;
    else if (Array.isArray(data.jobs)) rows = data.jobs;
    else if (Array.isArray(data.scholarships)) rows = data.scholarships;
    else if (Array.isArray(data.admissions)) rows = data.admissions;
    else throw new Error('JSON must be an array or { records: [] } / { data: [] } / { jobs: [] }');
  } else if (ext === 'csv') {
    const raw = fs.readFileSync(filePath, 'utf8');
    rows = parseCsv(raw);
  } else if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else {
    throw new Error('Unsupported file type. Use .json, .csv, .xlsx, or .xls');
  }

  return normalizeImportRows(rows);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => { row[h] = cols[j]?.trim() ?? ''; });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((s) => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

/** Normalize header keys: strip BOM, lowercase, spaces/dashes → underscores */
function normalizeKey(key) {
  return String(key)
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function cellToString(val) {
  if (val == null || val === '') return '';
  if (val instanceof Date) return val.toISOString();
  return String(val).trim();
}

/** Normalize parsed rows so Title / Organization / Job Title etc. map consistently */
export function normalizeImportRows(rows) {
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return {};
    const normalized = {};
    for (const [key, val] of Object.entries(row)) {
      const nk = normalizeKey(key);
      if (!nk) continue;
      normalized[nk] = cellToString(val);
    }
    return normalized;
  });
}

/** Pick first non-empty value from normalized row keys */
export function pickField(row, ...keys) {
  for (const key of keys) {
    const val = row[normalizeKey(key)];
    if (val) return val;
  }
  return '';
}

export function detectedColumns(rows) {
  const keys = new Set();
  for (const row of rows.slice(0, 5)) {
    Object.keys(row || {}).forEach((k) => keys.add(k));
  }
  return [...keys];
}

/** Required column aliases per import resource (normalized keys) */
const RESOURCE_COLUMN_SPECS = {
  jobs: {
    title: ['title', 'job_title', 'jobtitle', 'position', 'role', 'name'],
    company: ['company', 'company_name', 'companyname', 'employer', 'organization', 'organisation', 'org'],
  },
  scholarships: {
    title: ['title', 'name', 'scholarship_title'],
    provider: ['provider', 'organization', 'organisation', 'sponsor', 'institution', 'company'],
  },
  admissions: {
    program: ['program', 'programme', 'degree', 'course'],
    institution: ['institution', 'university', 'college', 'school'],
  },
  blogs: {
    title: ['title', 'name', 'headline'],
  },
  mcqs: {
    question: ['question', 'q', 'text'],
    exam: ['examcode', 'exam_code', 'exam', 'examid', 'exam_id'],
  },
  'career-guidance': {
    title: ['title', 'name', 'headline'],
  },
  'foreign-studies': {
    country: ['country', 'nation'],
  },
};

function looksLikeContactData(cols) {
  const set = new Set(cols);
  return set.has('first_name') && set.has('last_name')
    && (set.has('email') || set.has('customer_id') || set.has('subscription_date'));
}

/**
 * Pre-flight check: do file headers match the selected import type?
 */
export function validateImportColumns(resource, rows) {
  const spec = RESOURCE_COLUMN_SPECS[resource];
  if (!spec || !rows.length) return { ok: true, detectedColumns: detectedColumns(rows), missing: [] };

  const cols = detectedColumns(rows);
  const colSet = new Set(cols);
  const missing = [];

  for (const [field, aliases] of Object.entries(spec)) {
    const found = aliases.some((a) => colSet.has(normalizeKey(a)));
    if (!found) {
      missing.push({ field, acceptedColumns: aliases });
    }
  }

  let hint;
  if (missing.length && looksLikeContactData(cols)) {
    hint = 'This file looks like customer/contact data (first_name, last_name, email, etc.), not Strideto content listings. Use a jobs or scholarships template with the correct columns.';
  }

  return { ok: missing.length === 0, detectedColumns: cols, missing, hint };
}

export function formatColumnMismatchError(resource, validation) {
  const parts = [`Column mismatch for "${resource}" import.`];
  if (validation.detectedColumns?.length) {
    parts.push(`Found in your file: ${validation.detectedColumns.join(', ')}.`);
  }
  for (const m of validation.missing || []) {
    parts.push(`Missing "${m.field}" (use one of: ${m.acceptedColumns.join(', ')}).`);
  }
  if (validation.hint) parts.push(validation.hint);
  return parts.join(' ');
}

export function createImportReport() {
  return { imported: 0, skipped: 0, failed: 0, errors: [] };
}

export function recordError(report, index, message, row = null) {
  report.failed++;
  report.errors.push({ row: index + 1, message, data: row });
}
