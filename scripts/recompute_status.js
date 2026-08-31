/**
 * Recompute Compliant / Not compliant statuses in lead-data.csv.
 *
 * Why this exists: the per-system statuses were originally categorized
 * against the 2021–2024 window (20% cumulative replacement = 5%/year x 4
 * years). Each time a new replacement year is added, the threshold and
 * window move (2021–2025 = 25%), and statuses must be refreshed or the
 * progress bars (which use current totals) will disagree with the
 * category — e.g. Athens showed 26% replaced but "Not compliant".
 *
 * Only rows whose Status is already 'Compliant' or 'Not compliant' are
 * touched. Hand-categorized statuses ('100% replaced', 'No lead lines',
 * 'Inventory not received or incomplete', wholesale-only, etc.) are left
 * alone.
 *
 * The percent formula matches convertCsv.js exactly:
 *   replaced / (totalToReplace + replaced)
 * ("Total To Replace" counts lines still needing replacement, so replaced
 * lines are added back to form the original denominator.)
 *
 * Usage (from repo root), after adding a new LSLR year:
 *   1. Update THRESHOLD_PCT and WINDOW_LABEL below for the new year.
 *   2. node scripts/recompute_status.js
 *   3. node scripts/convertCsv.js
 * Review scripts/status_change_review.csv (send the flips to Elin)
 * before pushing.
 */
const fs = require('fs');
const Papa = require('papaparse');

const THRESHOLD_PCT = 25; // 5% per year since 2021: 2021–2025 = 25%
const WINDOW_LABEL = '2021–2025';

const csvFile = fs.readFileSync('lead-data.csv', 'utf8');
const parsed = Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) => h.trim(),
});

const clean = (val) => {
  if (!val || val === '-' || String(val).trim() === '-') return 0;
  const num = parseFloat(String(val).replace(/[,"\s%]/g, ''));
  return isNaN(num) ? 0 : num;
};

const changes = [];
let compliant = 0;
let notCompliant = 0;

for (const row of parsed.data) {
  const status = (row['Status'] || '').trim();
  if (status !== 'Compliant' && status !== 'Not compliant') continue;

  const replaced = clean(row['Total Replaced']);
  const toReplace = clean(row['Total To Replace']);
  const denom = toReplace + replaced;
  const pct = denom > 0 ? (replaced / denom) * 100 : 0;

  const newStatus = pct >= THRESHOLD_PCT ? 'Compliant' : 'Not compliant';
  const newExplanation =
    newStatus === 'Compliant'
      ? `Compliant (≥${THRESHOLD_PCT}% average replacement, ${WINDOW_LABEL})`
      : `Not Compliant (<${THRESHOLD_PCT}% average replacement, ${WINDOW_LABEL})`;

  if (newStatus !== status) {
    changes.push({
      PWSID: row['PWSID'],
      'Supply Name': row['Supply Name'],
      'Percent Replaced': pct.toFixed(1) + '%',
      'Old Status': status,
      'New Status': newStatus,
    });
  }
  row['Status'] = newStatus;
  row['Status Explanation'] = newExplanation;
  if (newStatus === 'Compliant') compliant++;
  else notCompliant++;
}

fs.writeFileSync(
  'lead-data.csv',
  Papa.unparse(parsed.data, { columns: parsed.meta.fields })
);
fs.writeFileSync('scripts/status_change_review.csv', Papa.unparse(changes));

console.log(`Threshold: ${THRESHOLD_PCT}% (${WINDOW_LABEL})`);
console.log(`Compliant: ${compliant} | Not compliant: ${notCompliant}`);
console.log(`Status changes: ${changes.length} (see scripts/status_change_review.csv)`);
changes.forEach((c) =>
  console.log(
    `  ${c['Old Status']} -> ${c['New Status']}: ${c['Supply Name']} (${c['PWSID']}) ${c['Percent Replaced']}`
  )
);
console.log('\nNext: node scripts/convertCsv.js  (regenerates src/data/waterSystemsData.js)');
