/**
 * Shared lead action level exceedance logic, derived from the auto-updatable
 * monitoring history (mergedData) rather than the static EGLE workbook export.
 *
 * mergedData is refreshed from the state's 90th Percentiles dataset by
 * scripts/update_history_from_socrata.py, so everything computed here stays
 * current without a manual re-import of waterSystemsData.
 *
 * Michigan's action level dropped from 15 ppb to 12 ppb starting in 2025;
 * pre-2025 readings are judged against the 15 ppb standard in effect at
 * the time. Mirrors the year-aware rules in SystemTrendPanel.
 */
import mergedData from './mergedData';

export const ACTION_LEVEL_OLD = 15; // pre-2025 standard
export const ACTION_LEVEL_NEW = 12; // current standard
export const TRANSITION_YEAR = 2025;

/** Action level (ppb) applicable to a given monitoring year. */
export const actionLevelForYear = (year) =>
  year >= TRANSITION_YEAR ? ACTION_LEVEL_NEW : ACTION_LEVEL_OLD;

/** True when a 90th percentile reading exceeds the level in effect that year. */
export const isExceedance = (ppb, year) =>
  ppb != null && ppb > actionLevelForYear(year);

/**
 * Most recent exceedance year per system, derived from monitoring history.
 * Map of base_pwsid -> year (number).
 */
const derivedExceedanceYears = (() => {
  const byPwsid = new Map();
  mergedData.forEach((row) => {
    if (isExceedance(row.lead_90th_ppb, row.year)) {
      const prev = byPwsid.get(row.base_pwsid);
      if (!prev || row.year > prev) byPwsid.set(row.base_pwsid, row.year);
    }
  });
  return byPwsid;
})();

/**
 * Most recent exceedance year for a directory/map system, or null.
 *
 * Prefers the history-derived year; falls back to the system's static
 * `exceedance` field for the couple of pre-history determinations the
 * monitoring dataset doesn't cover. When both exist, the newer year wins.
 */
export function getExceedanceYear(system) {
  const derived = derivedExceedanceYears.get(system.pwsid) ?? null;
  const raw = system.exceedance;
  const fromStatic =
    raw && raw !== '-' ? parseInt(String(raw), 10) || null : null;
  if (derived == null) return fromStatic;
  if (fromStatic == null) return derived;
  return Math.max(derived, fromStatic);
}

/**
 * Systems whose MOST RECENT monitoring result exceeds the applicable action
 * level. Uses each system's latest monitoring period; when subsystems share
 * that period, the highest reading is used (worst case, matching the
 * System Trends chart). Sorted worst-first.
 *
 * @returns {Array<{ basePwsid, name, county, ppb, year, periodEnd }>}
 */
export function getCurrentExceedances(data = mergedData) {
  const latest = new Map(); // base_pwsid -> worst row of latest period
  data.forEach((row) => {
    if (row.lead_90th_ppb == null || !row.monitoring_end_date) return;
    const prev = latest.get(row.base_pwsid);
    if (
      !prev ||
      row.monitoring_end_date > prev.monitoring_end_date ||
      (row.monitoring_end_date === prev.monitoring_end_date &&
        row.lead_90th_ppb > prev.lead_90th_ppb)
    ) {
      latest.set(row.base_pwsid, row);
    }
  });

  return [...latest.values()]
    .filter((row) => isExceedance(row.lead_90th_ppb, row.year))
    .map((row) => ({
      basePwsid: row.base_pwsid,
      name: row.display_name || row.system_name,
      county: row.county,
      ppb: row.lead_90th_ppb,
      year: row.year,
      periodEnd: row.monitoring_end_date,
    }))
    .sort((a, b) => b.ppb - a.ppb);
}
