/**
 * One-off: compare api_report_for_notion.csv "Full API URL" paths to common Angular prefixes.
 * Run: node tools/audit-api-csv-vs-frontend.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const csvPath = path.join(root, 'api_report_for_notion.csv');

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split(/\r?\n/).slice(1).filter((l) => l.trim());

/** @type {Map<string, {method:string, local:string, file:string}[]>} */
const byBase = new Map();

for (const line of lines) {
  // CSV: Module, File, Base Route, HTTP Method, Local Endpoint, Full API URL, ...
  const parts = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === ',' && !inQ) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  parts.push(cur);
  if (parts.length < 6) continue;

  const file = parts[1];
  const method = parts[3];
  const full = parts[5].trim();
  const local = parts[4].trim();

  const key = full.replace(/^https?:\/\/[^/]+/, '') || full;
  if (!byBase.has(key)) byBase.set(key, []);
  byBase.get(key).push({ method, local, file });
}

console.log('Total CSV data rows (parsed):', lines.length);
console.log('Unique Full API URL strings:', byBase.size);

// Angular conventions observed in repo (relative to environment.apiUrl which ends with /api)
const angularPrefixes = [
  '/v1/users',
  '/v1/user', // if aligned to CSV
  '/v1/hrms',
  '/v1/department',
  '/v1/note',
  '/v1/notes',
  '/v1/masterList',
  '/v1/master-list',
  '/v1/notification',
  '/v1/notifications',
  '/v1/customer',
  '/v1/customers',
];

console.log('\n--- Path convention mismatches (CSV vs typical Angular in this repo) ---');
const mismatches = [
  ['Backend CSV uses /api/v1/user (singular)', 'Angular uses /v1/users (plural)'],
  ['Backend CSV HRMS flat routes: /api/v1/department, /api/v1/shift, ...', 'Angular HRMSService uses /v1/hrms/departments, /v1/hrms/shifts, ...'],
  ['Backend CSV /api/v1/masterList', 'Angular uses /v1/master-list (kebab-case)'],
  ['Backend CSV /api/v1/note', 'notes.service uses /v1/notes (plural)'],
  ['Backend CSV /api/v1/notification (singular)', 'Angular notification.service uses /v1/notifications (plural)'],
];

mismatches.forEach(([a, b]) => console.log(`• ${a}\n  → ${b}\n`));

// Count how many CSV routes are under /api/v1/hrms — none in CSV (HRMS uses flat resource names)
let flatHrms = 0;
let nestedHrms = 0;
for (const k of byBase.keys()) {
  if (k.includes('/api/v1/hrms')) nestedHrms++;
  if (
    /\/api\/v1\/(department|designation|shift|holiday|leave)/i.test(k)
  )
    flatHrms++;
}
console.log('CSV paths containing /api/v1/hrms:', nestedHrms);
console.log('CSV paths matching flat HRMS resource names (department|designation|shift|holiday|leave):', flatHrms);
