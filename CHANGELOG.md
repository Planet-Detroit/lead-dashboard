# Changelog

Plain-language log of significant changes to the dashboard. Newest first.
(Every individual change is also recorded in the git commit history.)

## August 31, 2026

Work session with Claude Code (Nina), following the Aug 31 call with Elin.

**Data updates**
- Refreshed 90th percentile lead testing data from the state API through
  Aug 30, 2026: 76 new monitoring rows (mostly the June 2026 period) and
  1 correction. Four new action level exceedances appeared: Hermansville
  Housing Commission (29 ppb), Corewell Health–Berrien Center (18 ppb),
  Garden City (16 ppb), Chateaux du Lac Condominiums (16 ppb).
- Updated lead service line replacement data through 2025 from EGLE's
  corrected LSLR file (posted July 1, 2026). The corrected file was treated
  as authoritative for all years, which fixed a long-standing gap: the
  original data merge had dropped replacement counts for any year where a
  system didn't also have a lead test that year (369 system-year values
  restored). New statewide totals: 98,253 lines replaced 2021–2025 (16.9%),
  with 28,332 in 2025 — the biggest year yet.

**New features**
- "Current Lead Action Level Exceedances" table on the Overview tab,
  listing systems whose latest test exceeds the action level; clicking a
  system shows its trend.
- Exceedance badges in Search Systems and map popups now derive from the
  auto-updatable monitoring history instead of a static file.
- System Trends chart defaults to City of Detroit.

**Process**
- New repeatable update scripts: `scripts/update_history_from_socrata.py`
  (testing data) and `scripts/update_replacements_from_lslr.py`
  (replacement data). See DATA-UPDATES.md.
- The daily monitor now also watches EGLE's LSLR progress page and
  cc's @ninaplanetdetroit on alert issues so they trigger emails.
- Closed out the backlog of 7 unreviewed data alert issues.

## May 2026

- Searchable combobox for System Trends; automatic GitHub Pages deploys;
  visualization and data cleaning improvements from the University of
  Michigan student team (Vaibhav Sen Malla, Xiao Dong).

## 2025

- Initial dashboard built in collaboration with Safe Water Engineering
  (Elin Betanzo): 2021–2024 replacement data, inventory, map, directory.
