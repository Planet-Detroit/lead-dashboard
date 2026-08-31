#!/usr/bin/env python3
"""
Update src/data/mergedData.csv with the latest results from Michigan's
Public Water Supply 90th Percentiles dataset (Socrata, 39ya-9txc).

The state dataset is a snapshot: one row per system with its most recent
monitoring result. This script appends rows the history file doesn't have
yet and corrects rows the state has revised, following the rules from
data_cleaning_pipeline/README.md:

- above_action_level = lead_90th_ppb > 12 (Michigan action level)
- reuse an existing resolved_pwsid only on an exact system_name match
  under the same base PWSID
- a new system_name under an existing base PWSID gets the next unused
  letter suffix, and is written to a review file for a human to check
- inventory columns are left blank on new rows (inventory data comes from
  the separate LSLR/DSMI pipeline, not this dataset)

Usage:  python3 scripts/update_history_from_socrata.py
Then:   cd scripts && node convertMergedCsv.js   (regenerates mergedData.js)

Outputs a summary and scripts/socrata_update_review.csv (rows needing review).
"""
import csv, json, string, sys, urllib.request
from collections import defaultdict

CSV_PATH = 'src/data/mergedData.csv'
REVIEW_PATH = 'scripts/socrata_update_review.csv'
API = 'https://data.michigan.gov/resource/39ya-9txc.json?$limit=5000'

def fmt_ppb(v):
    f = float(v or 0)
    return str(int(f)) + '.0' if f == int(f) else str(f)

snap = json.load(urllib.request.urlopen(API))
print(f'Fetched {len(snap)} rows from state API')

with open(CSV_PATH, newline='') as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    rows = list(reader)

# Index existing history
name_to_resolved = {}                 # (base, system_name) -> resolved
suffixes = defaultdict(set)           # base -> set of used suffix letters
existing = {}                         # (resolved, monitoring_end_date) -> row
for r in rows:
    name_to_resolved[(r['base_pwsid'], r['system_name'])] = r['resolved_pwsid']
    if '-' in r['resolved_pwsid']:
        suffixes[r['base_pwsid']].add(r['resolved_pwsid'].split('-')[1])
    existing[(r['resolved_pwsid'], r['monitoring_end_date'])] = r

added, corrected, review = [], [], []
for s in snap:
    base = s['public_water_supply_id']
    name = s['system_name'].strip()
    end = s.get('last_monitoring_period_end', '')[:10]
    ppb = fmt_ppb(s.get('lead_90th_percentile_ppb'))
    if not base or not end:
        continue

    resolved = name_to_resolved.get((base, name))
    if resolved is None:
        if any(b == base for b, _ in name_to_resolved):
            # new name under an existing base: assign next unused suffix, flag it
            nxt = next(c for c in string.ascii_lowercase if c not in suffixes[base])
            suffixes[base].add(nxt)
            resolved = f'{base}-{nxt}'
            review.append([base, resolved, name, 'new system_name under existing base PWSID'])
        else:
            resolved = base
            review.append([base, resolved, name, 'entirely new PWSID'])
        name_to_resolved[(base, name)] = resolved

    key = (resolved, end)
    if key in existing:
        old = existing[key]
        if float(old['lead_90th_ppb'] or 0) != float(ppb):
            corrected.append((name, end, old['lead_90th_ppb'], ppb))
            old['lead_90th_ppb'] = ppb
            old['above_action_level'] = str(float(ppb) > 12)
    else:
        new = {k: '' for k in fields}
        new.update(base_pwsid=base, resolved_pwsid=resolved, system_name=name,
                   display_name=name, county=s.get('county', '').strip(),
                   monitoring_end_date=end, year=end[:4], lead_90th_ppb=ppb,
                   above_action_level=str(float(ppb) > 12))
        rows.append(new)
        added.append((name, end, ppb))
        existing[key] = new

# keep existing rows in original order; new rows sort to the end of their
# base_pwsid group so the diff stays append-only
order = {id(r): i for i, r in enumerate(rows)}
rows.sort(key=lambda r: (r['base_pwsid'], order.get(id(r), 10**9),
                         r['resolved_pwsid'], r['monitoring_end_date']))
with open(CSV_PATH, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

if review:
    with open(REVIEW_PATH, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['base_pwsid', 'assigned_resolved_pwsid', 'system_name', 'reason'])
        w.writerows(review)

print(f'Added {len(added)} new monitoring rows, corrected {len(corrected)} existing rows')
for n, e, o, p in corrected:
    print(f'  corrected: {n} {e}: {o} -> {p} ppb')
exceed = [(n, e, p) for n, e, p in added if float(p) > 12]
print(f'New rows above the 12 ppb action level: {len(exceed)}')
for n, e, p in exceed:
    print(f'  EXCEEDANCE: {n} {e}: {p} ppb')
print(f'Rows needing review: {len(review)}' + (f' -> {REVIEW_PATH}' if review else ''))
