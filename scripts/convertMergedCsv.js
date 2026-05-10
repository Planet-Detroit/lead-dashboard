const fs = require('fs');
const Papa = require('papaparse');

const csvFile = fs.readFileSync('../src/data/mergedData.csv', 'utf8');
const parsed = Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true,
  transformHeader: h => h.trim(),
});

const jsData = parsed.data.map(row => {
  // Helper: parse a float, returning null for empty/missing values
  // Unlike convertCsv.js we use null (not 0) because missing data
  // means "no data this year", not "zero lines replaced"
  const cleanFloat = (val) => {
    if (!val || val.trim() === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const cleanString = (val) => {
    if (!val) return '';
    return String(val).trim();
  };

  const cleanInt = (val) => {
    const f = cleanFloat(val);
    return f == null ? null : Math.round(f);
  };

  return {
    base_pwsid:                  cleanString(row['base_pwsid']),
    resolved_pwsid:              cleanString(row['resolved_pwsid']),
    system_name:                 cleanString(row['system_name']),
    display_name:                cleanString(row['display_name']),
    county:                      cleanString(row['county']),
    monitoring_end_date:         cleanString(row['monitoring_end_date']),
    year:                        cleanInt(row['year']),
    lead_90th_ppb:               cleanFloat(row['lead_90th_ppb']),
    // CSV stores Python-style 'True'/'False' strings — normalize to booleans
    above_action_level:          row['above_action_level']?.trim() === 'True',
    lines_replaced:              cleanFloat(row['lines_replaced']),
    inventory_lead:              cleanFloat(row['inventory_lead']),
    inventory_gpcl:              cleanFloat(row['inventory_gpcl']),
    inventory_unknown:           cleanFloat(row['inventory_unknown']),
    total_to_identify_or_replace: cleanFloat(row['total_to_identify_or_replace']),
    // Same boolean normalization for inventory_complete_flag
    inventory_complete_flag:     row['inventory_complete_flag']?.trim() === 'True',
  };
}).filter(row => row.base_pwsid && row.year != null);

const output = 'export const mergedData = '
  + JSON.stringify(jsData, null, 2)
  + ';\n\nexport default mergedData;';

fs.writeFileSync('../src/data/mergedData.js', output);
console.log(`Done! Written ${jsData.length} rows to ../src/data/mergedData.js`);