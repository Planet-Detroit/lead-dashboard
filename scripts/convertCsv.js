const fs = require('fs');
const Papa = require('papaparse');

const csvFile = fs.readFileSync('lead-data.csv', 'utf8');
const parsed = Papa.parse(csvFile, { 
  header: true, 
  skipEmptyLines: true,
  transformHeader: h => h.trim()
});

const jsData = parsed.data.map(row => {
  const clean = (val) => {
    if (!val || val === '-' || val === '-   ' || val === '') return 0;
    const num = parseFloat(String(val).replace(/[,"\s%]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const cleanString = (val) => {
    if (!val || val === '-' || val === '-   ') return '';
    return String(val).trim();
  };

  const leadLines = clean(row['Lead Lines']);
  const gpcl = clean(row['GPCL']);
  const unknown = clean(row['Unknown']);
  const totalToReplace = clean(row['Total To Replace']) || (leadLines + gpcl + unknown);
  const totalReplaced = clean(row['Total Replaced']);
  
  // Use the manually categorized status
  const status = cleanString(row['Status']) || 'Unknown';
  
  // Calculate percent replaced, but cap at 100%
  let percentReplaced = totalToReplace > 0 ? (totalReplaced / totalToReplace) * 100 : 0;
  if (percentReplaced > 100) percentReplaced = 100;

  return {
    pwsid: cleanString(row['PWSID']),
    name: cleanString(row['Supply Name']),
    population: clean(row['Population']),
    y2021: clean(row['2021']),
    y2022: clean(row['2022']),
    y2023: clean(row['2023']),
    y2024: clean(row['2024']),
    leadLines: leadLines,
    gpcl: gpcl,
    unknown: unknown,
    totalToReplace: totalToReplace,
    totalReplaced: totalReplaced,
    percentReplaced: percentReplaced,
    nonLead: clean(row['Non-Lead']),
    totalLines: clean(row['Total Lines']),
    exceedance: cleanString(row['Exceedance']),
    latitude: clean(row['Latitude']) || null,
    longitude: clean(row['Longitude']) || null,
    epaLink: cleanString(row['EPA_Link']),
    status: status,
    statusExplanation: cleanString(row['Status Explanation'])
  };
}).filter(row => row.pwsid);

// Generate summary statistics
const stats = {
  total: jsData.length,
  byStatus: {}
};

jsData.forEach(row => {
  stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + 1;
});

console.log('=== Data Summary ===');
console.log(`Total systems: ${stats.total}`);
console.log('\nBy Status:');
Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`);
});

const output = 'export const waterSystemsData = ' + JSON.stringify(jsData, null, 2) + ';\n\nexport default waterSystemsData;';

fs.writeFileSync('src/data/waterSystemsData.js', output);
console.log('\nDone! Written to src/data/waterSystemsData.js');
