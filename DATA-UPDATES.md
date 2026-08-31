# How to update the dashboard's data

The dashboard has three data streams, each with its own source, schedule,
and update path. A GitHub Actions monitor checks all sources daily at
9 AM Eastern and opens an issue (cc @ninaplanetdetroit) when something
changes.

Everything below is run from the repository root. After any data update,
the site deploys automatically when the changes are pushed to `main`
(GitHub Actions → GitHub Pages, ~1 minute).

## 1. Lead testing data (90th percentile) — changes a few times a year

- **Source:** Michigan's Public Water Supply 90th Percentiles dataset
  (Socrata API, checked automatically). It's a snapshot — one row per
  system with its latest result — while the dashboard keeps full history.
- **When:** whenever the monitor opens an issue saying the Socrata source
  changed. New results typically land after monitoring periods end
  (June 30 and December 31).
- **How:**
  ```
  python3 scripts/update_history_from_socrata.py
  node scripts/convertMergedCsv.js   # run from scripts/ or use: cd scripts && node convertMergedCsv.js
  ```
  The script prints what changed, flags any NEW action level exceedances,
  and writes `scripts/socrata_update_review.csv` when a system appears
  under a new name (someone should sanity-check those rows).
- **What updates on the site automatically:** the Current Exceedances
  table, exceedance badges and filters, map popups, lead level trend
  charts. Also update the data date in `src/components/About.js`.

## 2. Replacement data (LSLR) — once a year, around July

- **Source:** EGLE's LSLR progress page (the monitor watches it):
  https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/community-water-supply/lead-and-copper-rule/lslr-progress
  Utilities report by March 31 for the prior year; EGLE posts the combined
  file in early summer (2026: July 1). Elin usually flags it too.
- **How:**
  1. Download the file, export/save it as CSV over
     `data_cleaning_pipeline/2021-2025-LSLR-Data.csv` (update the filename
     and the `LSLR_PATH`/`YEARS` lines in the script for the new year).
  2. Run:
     ```
     python3 scripts/update_replacements_from_lslr.py
     node scripts/convertMergedCsv.js
     node scripts/convertCsv.js
     ```
  3. Add the new year in the components (each has a comment showing how):
     `LSLR_YEARS` in `src/components/SystemTrendPanel.js` and
     `ReplacementTrendChart.js`; the `SparkBars` year lists in
     `src/components/WaterSystemDirectory.js`; `y20XX` in
     `scripts/convertCsv.js`.
  4. Update the hardcoded headline numbers in
     `src/components/Dashboard.js` (`totalReplaced`, `actualProgress`,
     the "(2021–20XX)" labels) and the totals in `README.md` — the
     update script prints the new statewide totals to use.
- **Gotchas learned in 2026:** EGLE has posted files with swapped
  name/county columns (they corrected it — eyeball the file first); one
  PWSID can report sub-communities on separate rows (the script sums
  them); treat EGLE's newest file as authoritative for ALL years, since
  they correct earlier years when reposting.

## 3. Inventory data (DSMI) — annual, needs human review

- **Source:** EGLE DSMI Inventories page (the monitor watches it). This
  feeds the service line counts (lead/GPCL/unknown), the 580,030 "total
  to replace" figure, system statuses, and the directory/map.
- **How:** this one is NOT scripted end-to-end. It goes through the
  student-built notebook pipeline in `data_cleaning_pipeline/` (see its
  README and the step-by-step PDF there), which includes deliberate
  manual review steps for ambiguous system names. Statuses in
  `lead-data.csv` (e.g. "100% replaced") are hand-categorized. Budget a
  working session, and loop in Elin for judgment calls.

## Who to loop in

Elin Betanzo (Safe Water Engineering) is the data partner: she watches
EGLE, catches posting errors, and reviews the dashboard after updates.
Send her a summary of what changed after each update.
