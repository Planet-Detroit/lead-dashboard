#!/usr/bin/env python3
"""
Rebuild lead service line replacement counts from EGLE's corrected
2021-2025 LSLR file (data_cleaning_pipeline/2021-2025-LSLR-Data.csv,
saved from the download on EGLE's LSLR progress page).

Treats the EGLE file as authoritative for ALL years, because EGLE
corrected earlier-year errors when reposting (per Safe Water Engineering,
July 2026), and because the previous merge only kept replacement counts
for years where a system also had a monitoring row — dropping data.

Updates:
- src/data/mergedData.csv: clears every lines_replaced value, then attaches
  the EGLE count to one row per (base_pwsid, year) — adding a
  replacement-only row (no monitoring fields) when that year has none.
- lead-data.csv: rewrites the 2021-2024 columns, adds a 2025 column, and
  recomputes Total Replaced and Percent Replaced per system.

Usage:  python3 scripts/update_replacements_from_lslr.py
Then:   cd scripts && node convertMergedCsv.js && node convertCsv.js
"""
import csv
from collections import defaultdict

LSLR_PATH = 'data_cleaning_pipeline/2021-2025-LSLR-Data.csv'
MERGED_PATH = 'src/data/mergedData.csv'
LEAD_PATH = 'lead-data.csv'
YEARS = [2021, 2022, 2023, 2024, 2025]

# ---- read EGLE file ----
repl = {}   # (pwsid, year) -> count
meta = {}   # pwsid -> (name, county)
with open(LSLR_PATH, newline='') as f:
    for r in csv.DictReader(f):
        if r['Lines Replaced'] == '':
            continue
        key = (r['PWSID'], int(r['Year']))
        # a PWSID can report sub-communities on separate rows (e.g. Kalamazoo
        # Lake Sewer & Water Authority) — sum them
        repl[key] = repl.get(key, 0) + float(r['Lines Replaced'])
        meta[r['PWSID']] = (r['Supply Name'].strip(), r['County'].strip())
print(f'EGLE file: {len(repl)} system-year counts, {len(meta)} systems')

# ---- mergedData.csv ----
with open(MERGED_PATH, newline='') as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    rows = list(reader)

for r in rows:
    r['lines_replaced'] = ''

# attach each count to exactly one row per (base_pwsid, year) so charts
# that sum rows never double-count
slot = {}
for r in rows:
    key = (r['base_pwsid'], int(r['year']))
    if key not in slot:
        slot[key] = r

names = {}  # base_pwsid -> (system_name, county) from existing rows
for r in rows:
    names.setdefault(r['base_pwsid'], (r['system_name'], r['county']))

added = 0
for (pwsid, year), count in repl.items():
    val = str(int(count)) + '.0'
    if (pwsid, year) in slot:
        slot[(pwsid, year)]['lines_replaced'] = val
    else:
        name, county = names.get(pwsid) or meta[pwsid]
        new = {k: '' for k in fields}
        new.update(base_pwsid=pwsid, resolved_pwsid=pwsid, system_name=name,
                   display_name=name, county=county, year=str(year),
                   lines_replaced=val)
        rows.append(new)
        added += 1

order = {id(r): i for i, r in enumerate(rows)}
rows.sort(key=lambda r: (r['base_pwsid'], order.get(id(r), 10**9), r['year']))
with open(MERGED_PATH, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
print(f'mergedData: attached {len(repl) - added} counts to existing rows, '
      f'added {added} replacement-only rows')

# ---- lead-data.csv ----
with open(LEAD_PATH, newline='') as f:
    reader = csv.DictReader(f)
    lfields = reader.fieldnames[:]
    lrows = list(reader)
if '2025' not in lfields:
    lfields.insert(lfields.index('2024') + 1, '2025')

old_total = sum(float(r['Total Replaced'].replace(',', '') or 0)
                for r in lrows if r['Total Replaced'] not in ('', '-'))
matched = set()
for r in lrows:
    p = r['PWSID']
    total = 0.0
    for y in YEARS:
        c = repl.get((p, y))
        r[str(y)] = str(int(c)) if c is not None else ''
        total += c or 0
        if c is not None:
            matched.add((p, y))
    r['Total Replaced'] = str(int(total)) if total else ''
    to_replace = float((r['Total To Replace'] or '0').replace(',', '') or 0)
    if total and (to_replace or total):
        pct = min(total / (to_replace + total) * 100, 100)
        r['Percent Replaced'] = f'{pct:.1f}%'
    r.setdefault('2025', r.get('2025', ''))
with open(LEAD_PATH, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=lfields)
    w.writeheader()
    w.writerows(lrows)

unmatched = {p for (p, y) in repl if (p, y) not in matched}
new_total = int(sum(repl.values()))
print(f'lead-data.csv: statewide total replaced {int(old_total)} -> {new_total}')
by_year = defaultdict(float)
for (p, y), c in repl.items():
    by_year[y] += c
print('statewide by year:', {y: int(v) for y, v in sorted(by_year.items())})
if unmatched:
    print(f'NOTE: {len(unmatched)} EGLE systems not in the directory file '
          f'(their counts still reach mergedData): {sorted(unmatched)[:10]}')
