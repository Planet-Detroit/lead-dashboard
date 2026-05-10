/**
 * mockMergedData.js
 *
 * Mock data shaped to match the final merged CSV from the data pipeline.
 * Replace this import with the real data file once the pipeline is complete:
 *
 *   // Before (mock):
 *   import mergedData from '../data/mockMergedData';
 *   // After (real CSV converted to JS):
 *   import mergedData from '../data/mergedData';
 *
 * Column reference (matches pipeline output):
 *   base_pwsid                   — original utility-level PWSID
 *   resolved_pwsid               — subsystem-level ID (e.g. MI0000324-a) when a
 *                                  base PWSID maps to multiple system names;
 *                                  equals base_pwsid when no split needed
 *   system_name                  — raw/original name from source data
 *   display_name                 — cleaned label for UI display
 *   county                       — Michigan county name
 *   year                         — reporting year (2021–2025)
 *   lead_90th_ppb                — 90th percentile lead concentration (ppb);
 *                                  null when monitoring data unavailable
 *   above_action_level           — true if system exceeded Michigan lead action
 *                                  level (15 ppb) in this year
 *   lines_replaced               — lines replaced this year (LSLR 2021–2024);
 *                                  null for 2025 (inventory year, no LSLR data)
 *   inventory_lead               — known lead lines from 2025 inventory;
 *                                  null for 2021–2024 (no inventory that year)
 *   inventory_gpcl               — galvanized previously connected to lead
 *   inventory_unknown            — lines with unknown material
 *   total_to_identify_or_replace — sum of lead + gpcl + unknown
 *   inventory_complete_flag      — false when inventory is incomplete;
 *                                  per client instruction NaN values are NOT
 *                                  filled — flag or exclude these in charts
 *
 * Long format: one row per resolved_pwsid per year.
 * Key rules:
 *   - Use resolved_pwsid as the unique row key, NOT base_pwsid
 *   - Use display_name for all UI labels, NOT system_name
 *   - inventory_* fields are only populated for year === 2025
 *   - lines_replaced is only populated for years 2021–2024
 */

const mockMergedData = [

  // --- ACME TOWNSHIP — no lead lines, complete inventory ---
  { base_pwsid: 'MI0000011', resolved_pwsid: 'MI0000011', system_name: 'ACME TOWNSHIP - HOPE VILLAGE', display_name: 'Acme Township',  county: 'Grand Traverse', year: 2021, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,    inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000011', resolved_pwsid: 'MI0000011', system_name: 'ACME TOWNSHIP - HOPE VILLAGE', display_name: 'Acme Township',  county: 'Grand Traverse', year: 2022, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,    inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000011', resolved_pwsid: 'MI0000011', system_name: 'ACME TOWNSHIP - HOPE VILLAGE', display_name: 'Acme Township',  county: 'Grand Traverse', year: 2023, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,    inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000011', resolved_pwsid: 'MI0000011', system_name: 'ACME TOWNSHIP - HOPE VILLAGE', display_name: 'Acme Township',  county: 'Grand Traverse', year: 2024, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,    inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000011', resolved_pwsid: 'MI0000011', system_name: 'ACME TOWNSHIP - HOPE VILLAGE', display_name: 'Acme Township',  county: 'Grand Traverse', year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: 0,    inventory_gpcl: 0,    inventory_unknown: 0,    total_to_identify_or_replace: 0,    inventory_complete_flag: true  },

  // --- ALBION CITY — not compliant, steady replacements ---
  { base_pwsid: 'MI0000025', resolved_pwsid: 'MI0000025', system_name: 'ALBION CITY', display_name: 'Albion City',   county: 'Calhoun',        year: 2021, lead_90th_ppb: 6.2,  above_action_level: false, lines_replaced: 12,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000025', resolved_pwsid: 'MI0000025', system_name: 'ALBION CITY', display_name: 'Albion City',   county: 'Calhoun',        year: 2022, lead_90th_ppb: 5.8,  above_action_level: false, lines_replaced: 25,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000025', resolved_pwsid: 'MI0000025', system_name: 'ALBION CITY', display_name: 'Albion City',   county: 'Calhoun',        year: 2023, lead_90th_ppb: 4.1,  above_action_level: false, lines_replaced: 41,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000025', resolved_pwsid: 'MI0000025', system_name: 'ALBION CITY', display_name: 'Albion City',   county: 'Calhoun',        year: 2024, lead_90th_ppb: 3.4,  above_action_level: false, lines_replaced: 67,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000025', resolved_pwsid: 'MI0000025', system_name: 'ALBION CITY', display_name: 'Albion City',   county: 'Calhoun',        year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: 420,  inventory_gpcl: 80,   inventory_unknown: 310,  total_to_identify_or_replace: 810,  inventory_complete_flag: true  },

  // --- ALPENA CITY — above action level 2021–2023, incomplete 2025 inventory ---
  { base_pwsid: 'MI0000058', resolved_pwsid: 'MI0000058', system_name: 'ALPENA CITY',  display_name: 'Alpena City',   county: 'Alpena',         year: 2021, lead_90th_ppb: 18.2, above_action_level: true,  lines_replaced: 5,    inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000058', resolved_pwsid: 'MI0000058', system_name: 'ALPENA CITY',  display_name: 'Alpena City',   county: 'Alpena',         year: 2022, lead_90th_ppb: 16.4, above_action_level: true,  lines_replaced: 18,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000058', resolved_pwsid: 'MI0000058', system_name: 'ALPENA CITY',  display_name: 'Alpena City',   county: 'Alpena',         year: 2023, lead_90th_ppb: 16.8, above_action_level: true,  lines_replaced: 60,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000058', resolved_pwsid: 'MI0000058', system_name: 'ALPENA CITY',  display_name: 'Alpena City',   county: 'Alpena',         year: 2024, lead_90th_ppb: 14.1, above_action_level: false, lines_replaced: 112,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000058', resolved_pwsid: 'MI0000058', system_name: 'ALPENA CITY',  display_name: 'Alpena City',   county: 'Alpena',         year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },

  // --- ANN ARBOR — compliant, large system, declining lead levels ---
  { base_pwsid: 'MI0000071', resolved_pwsid: 'MI0000071', system_name: 'ANN ARBOR CITY', display_name: 'Ann Arbor',   county: 'Washtenaw',      year: 2021, lead_90th_ppb: 3.1,  above_action_level: false, lines_replaced: 220,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000071', resolved_pwsid: 'MI0000071', system_name: 'ANN ARBOR CITY', display_name: 'Ann Arbor',   county: 'Washtenaw',      year: 2022, lead_90th_ppb: 2.8,  above_action_level: false, lines_replaced: 480,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000071', resolved_pwsid: 'MI0000071', system_name: 'ANN ARBOR CITY', display_name: 'Ann Arbor',   county: 'Washtenaw',      year: 2023, lead_90th_ppb: 2.2,  above_action_level: false, lines_replaced: 710,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000071', resolved_pwsid: 'MI0000071', system_name: 'ANN ARBOR CITY', display_name: 'Ann Arbor',   county: 'Washtenaw',      year: 2024, lead_90th_ppb: 1.8,  above_action_level: false, lines_replaced: 950,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000071', resolved_pwsid: 'MI0000071', system_name: 'ANN ARBOR CITY', display_name: 'Ann Arbor',   county: 'Washtenaw',      year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: 3200, inventory_gpcl: 800,  inventory_unknown: 1100, total_to_identify_or_replace: 5100, inventory_complete_flag: true  },

  // --- BATTLE CREEK — not compliant, Calhoun county ---
  { base_pwsid: 'MI0000101', resolved_pwsid: 'MI0000101', system_name: 'BATTLE CREEK CITY', display_name: 'Battle Creek', county: 'Calhoun',     year: 2021, lead_90th_ppb: 9.4,  above_action_level: false, lines_replaced: 40,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000101', resolved_pwsid: 'MI0000101', system_name: 'BATTLE CREEK CITY', display_name: 'Battle Creek', county: 'Calhoun',     year: 2022, lead_90th_ppb: 8.7,  above_action_level: false, lines_replaced: 95,   inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000101', resolved_pwsid: 'MI0000101', system_name: 'BATTLE CREEK CITY', display_name: 'Battle Creek', county: 'Calhoun',     year: 2023, lead_90th_ppb: 7.2,  above_action_level: false, lines_replaced: 190,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000101', resolved_pwsid: 'MI0000101', system_name: 'BATTLE CREEK CITY', display_name: 'Battle Creek', county: 'Calhoun',     year: 2024, lead_90th_ppb: 6.8,  above_action_level: false, lines_replaced: 310,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000101', resolved_pwsid: 'MI0000101', system_name: 'BATTLE CREEK CITY', display_name: 'Battle Creek', county: 'Calhoun',     year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: 1800, inventory_gpcl: 350,  inventory_unknown: 900,  total_to_identify_or_replace: 3050, inventory_complete_flag: true  },

  // --- FLINT — high replacement volume, historically above action level ---
  { base_pwsid: 'MI0002520', resolved_pwsid: 'MI0002520', system_name: 'FLINT, CITY OF', display_name: 'Flint',          county: 'Genesee',        year: 2021, lead_90th_ppb: 11.0, above_action_level: false, lines_replaced: 1200, inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null,  inventory_complete_flag: false },
  { base_pwsid: 'MI0002520', resolved_pwsid: 'MI0002520', system_name: 'FLINT, CITY OF', display_name: 'Flint',          county: 'Genesee',        year: 2022, lead_90th_ppb: 8.4,  above_action_level: false, lines_replaced: 2100, inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null,  inventory_complete_flag: false },
  { base_pwsid: 'MI0002520', resolved_pwsid: 'MI0002520', system_name: 'FLINT, CITY OF', display_name: 'Flint',          county: 'Genesee',        year: 2023, lead_90th_ppb: 6.1,  above_action_level: false, lines_replaced: 3400, inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null,  inventory_complete_flag: false },
  { base_pwsid: 'MI0002520', resolved_pwsid: 'MI0002520', system_name: 'FLINT, CITY OF', display_name: 'Flint',          county: 'Genesee',        year: 2024, lead_90th_ppb: 4.2,  above_action_level: false, lines_replaced: 4800, inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null,  inventory_complete_flag: false },
  { base_pwsid: 'MI0002520', resolved_pwsid: 'MI0002520', system_name: 'FLINT, CITY OF', display_name: 'Flint',          county: 'Genesee',        year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: 8900, inventory_gpcl: 1200, inventory_unknown: 3100, total_to_identify_or_replace: 13200, inventory_complete_flag: true  },

  // --- ATHENS — split PWSID example: same base_pwsid, two subsystems ---
  // Athens (Apartment): incomplete inventory
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-a', system_name: 'ATHENS(apartment)', display_name: 'Athens (Apartment)', county: 'Calhoun', year: 2021, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-a', system_name: 'ATHENS(apartment)', display_name: 'Athens (Apartment)', county: 'Calhoun', year: 2022, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-a', system_name: 'ATHENS(apartment)', display_name: 'Athens (Apartment)', county: 'Calhoun', year: 2023, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-a', system_name: 'ATHENS(apartment)', display_name: 'Athens (Apartment)', county: 'Calhoun', year: 2024, lead_90th_ppb: 0.0,  above_action_level: false, lines_replaced: 0,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-a', system_name: 'ATHENS(apartment)', display_name: 'Athens (Apartment)', county: 'Calhoun', year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: null, inventory_gpcl: 127, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  // Athens (main): complete inventory
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-b', system_name: 'ATHENS',            display_name: 'Athens',             county: 'Calhoun', year: 2021, lead_90th_ppb: 2.8,  above_action_level: false, lines_replaced: 4,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-b', system_name: 'ATHENS',            display_name: 'Athens',             county: 'Calhoun', year: 2022, lead_90th_ppb: 2.4,  above_action_level: false, lines_replaced: 8,  inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-b', system_name: 'ATHENS',            display_name: 'Athens',             county: 'Calhoun', year: 2023, lead_90th_ppb: 1.9,  above_action_level: false, lines_replaced: 10, inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-b', system_name: 'ATHENS',            display_name: 'Athens',             county: 'Calhoun', year: 2024, lead_90th_ppb: 1.4,  above_action_level: false, lines_replaced: 14, inventory_lead: null, inventory_gpcl: null, inventory_unknown: null, total_to_identify_or_replace: null, inventory_complete_flag: false },
  { base_pwsid: 'MI0000260', resolved_pwsid: 'MI0000260-b', system_name: 'ATHENS',            display_name: 'Athens',             county: 'Calhoun', year: 2025, lead_90th_ppb: null, above_action_level: false, lines_replaced: null, inventory_lead: 0,  inventory_gpcl: 127, inventory_unknown: 0, total_to_identify_or_replace: 447, inventory_complete_flag: true  },

];

export default mockMergedData;
