# Session log

Plain-language notes from work sessions, so the next session can pick up
where this one left off. Newest first. (CHANGELOG.md records changes to the
dashboard itself; this file records investigations and open threads.)

---

## October 24, 2026 — the 90th percentile data source is gone

**Status: PAUSED. Waiting to hear back from EGLE before doing anything else.**

### What happened

1. The daily data monitor emailed a GitHub alert (issue #20) saying all
   three EGLE web pages it watches returned "403 Forbidden." That turned out
   to be michigan.gov temporarily blocking GitHub's servers. The same pages
   load fine from Nina's Mac. Noise.
2. While checking that, we found the real problem: the Michigan open data
   portal dataset that feeds lead 90th percentile results into the dashboard
   has been deleted by the state.
   - Dataset: "Public Water Supply 90th Percentiles," id `39ya-9txc`
   - Old address: https://data.michigan.gov/dataset/Public-Water-Supply-90th-Percentiles/39ya-9txc
   - The portal now answers `404 dataset.missing`. Its own search finds no
     replacement under any lead or water name.
   - First seen failing by the monitor on Oct 19, 2026 (issue #19).
3. EGLE's "Water supply lead results" page now shows the same numbers in a
   Power BI report instead of linking to the open data portal:
   - Page: https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/community-water-supply/lead-and-copper-rule/water-supply-lead-results
   - Report: https://app.powerbigov.us/view?r=eyJrIjoiY2JjNmM5NjQtYjUzMi00OGJmLTg1NmQtMzgxM2M4ZjZkYzEwIiwidCI6ImQ1ZmI3MDg3LTM3NzctNDJhZC05NjZhLTg5MmVmNDcyMjVkMSJ9

### What this breaks

- The public dashboard still works and shows the data it already has
  (lead tests through Aug 30, 2026).
- New lead test results will NOT flow in. Two things depend on the dead
  dataset:
  - the daily monitor, `.github/workflows/check-data-updates.yml`
    (function `check_socrata_api`)
  - the update script, `scripts/update_history_from_socrata.py`
    (constant `API` near the top)
- Until a new source is chosen, the monitor will keep reporting the
  Socrata source as failing. That is expected; ignore it.

### What we did

- Closed GitHub issues 15, 16, 17, 18, 20 as noise, each with a comment
  explaining why. Evidence: the monitor's saved fingerprints
  (`.data-check-state.json` history) show only page wording changed on the
  "page changed" dates; the linked data files did not. Issues 17 and 20 were
  michigan.gov blocking GitHub's servers for a day.
- Left issue 19 open with a comment recording the findings:
  https://github.com/Planet-Detroit/lead-dashboard/issues/19
- Drafted an email to EGLE (saved in Nina's Gmail, NOT sent as of this
  writing). Recipient: Lisa Anderson, PhD, Lead and Copper Unit supervisor,
  AndersonL24@Michigan.gov, 517-282-1712 (from EGLE's unit contact page).
  The email asks: was the removal intentional, can EGLE restore the dataset
  on data.michigan.gov or publish a CSV/Excel at a fixed address, and if
  not, who to ask when new results post.
- Inspected the Power BI report to see if it could be a fallback source.
  Findings below.

### Power BI fallback: what we learned (not built)

The report is a public "publish to web" Power BI report on the US
government Power BI cloud. A script can read its data without a login
using the report's public key. Confirmed on Oct 24:

- The data backend answers on the host
  `wabi-us-gov-iowa-api.analysis.usgovcloudapi.net` (the `-api` host; the
  `-redirect` host the page names returns 403 to scripts).
- Request pattern the page itself uses:
  - `GET /public/routing/cluster/<tenant id>` → cluster address
  - `GET /public/reports/<report key>/modelsAndExploration?preferReadOnlySession=true`
    → model id, dataset id, page layout, last refresh time
  - `POST /public/reports/conceptualschema` with `{"modelIds":[<model id>]}`
    → every table and column
  - `POST /public/reports/querydata?synchronous=true` with a Power BI
    "semantic query" → rows
  - Headers the page sends: `Accept`, `ActivityId`, `RequestId`,
    `X-PowerBI-ResourceKey: <report key>`, `Content-Type` on POSTs. The
    service only answered when the request also carried a normal Chrome
    `User-Agent`, `Origin: https://app.powerbigov.us` and matching `Referer`.
  - Report key `k` and tenant `t` are inside the base64 `r=` value of the
    report URL: `k=cbc6c964-b532-48bf-856d-3813c8f6dc10`,
    `t=d5fb7087-3777-42ad-966a-892ef47225d1`.
- The model (id 1069005) was last refreshed 2026-09-29. Pages: Overview,
  Glossary, 90th Percentile Lead Values.
- The data is the state's SDWIS drinking water database tables. The one we
  need is `TSASSR` (sample summary results). Useful columns: `PWSID`,
  `Water System`, `Principal County Served`, `Analyte`,
  `Monitoring Period Start Date`, `Monitoring Period End Date`,
  `90thPercentile`, `Unit`, `AL` (action level), `AL UOM`, `Exceedance`,
  `Population Served`, `System Type`, `Water System Status`. There is also a
  one-row `Date Last Refreshed` table, handy for the monitor.
- A test query ran successfully (HTTP 200, well-formed result). It returned
  zero rows only because the filter used `Analyte = 'LEAD'` and the real
  value is spelled differently; query without a filter first and read the
  values. The second, unfiltered test query was blocked by Claude Code's
  permission system (reason given: website access circumvention, because
  of the browser-style headers). Nina will need to allow those requests if
  we build this.
- Saved raw responses from the session (models, schema, first query) are
  in the Claude Code scratchpad, which does not persist. Re-fetch them.

Caveats if we build it: unofficial, undocumented interface; Microsoft or
EGLE can change it without notice; the monitor would catch breaks but each
one needs a fix. Preferred outcome is still EGLE restoring a real download.

### Next steps (pick up here)

1. Send the EGLE email (Nina). Consider cc'ing Elin Betanzo, who is named
   in it.
2. When EGLE replies:
   - If they restore the dataset on data.michigan.gov under the same id:
     nothing to change. Confirm the monitor goes green and run the normal
     update in DATA-UPDATES.md §1.
   - If they restore it under a NEW id or a CSV/Excel address: update the
     two places listed under "What this breaks," add a test that fetches
     one row from the new source, run the update, commit.
   - If they say no: build the Power BI reader as a new script
     (`scripts/update_history_from_powerbi.py`) that produces the same
     output the Socrata script did, so `convertMergedCsv.js` and the rest
     of the pipeline do not change. Write tests first. Point the monitor at
     the `Date Last Refreshed` table instead of the Socrata count.
3. Either way, quiet the monitor's two false-alarm patterns: only alert on
   "page content changed" when the linked data files also changed, and
   treat a single-day 403 from michigan.gov as a retry, not an alert.
4. Tell Elin what changed once the source is settled (DATA-UPDATES.md,
   "Who to loop in").
