# Michigan Water Data Pipeline

This repository contains the data cleaning and merge pipelines used for Michigan water system data analysis.

The project focuses on three related datasets:

- Lead history data
- Lead Service Line Replacement (LSLR) data
- Inventory data

The goal is to clean these datasets, review ambiguous records carefully, preserve subsystem-level distinctions when needed, and create final merged outputs for downstream analysis and visualization.

## Project Overview

The pipeline is designed around a few important rules:

- Do not make assumptions when source data is ambiguous.
- Preserve original `system_name` values.
- Reuse existing subsystem IDs only when the exact `system_name` has already appeared under the same base `PWSID`.
- Do not infer or fill missing values in inventory data.
- Preserve monitoring-level detail in history data by keeping `monitoring_end_date`.

## Main Workflows

The full process has two major parts:

1. History data pipeline
2. LSLR / Inventory / final merge pipeline

### Part 1: History Data Pipeline

This workflow cleans a new lead history workbook, flags rows that need manual review, assigns subsystem IDs, and merges the reviewed result into the existing history file.

#### Notebook order

1. `01_lead_history_clean.ipynb`
2. `02_lead_history_assign_subid.ipynb`
3. `03_lead_history_merge.ipynb`

#### Step 1: Clean new history workbook

`01_lead_history_clean.ipynb`

What it does:

- standardizes column names
- converts date and numeric fields
- removes rows missing critical fields
- creates `year`, `month`, and `above_action_level`
- removes exact duplicate rows
- creates a `need_review` file for conflicting rows

Outputs:

- `clean_pipeline/<workbook_name>_cleaned.csv`
- `clean_pipeline/<workbook_name>_need_review.csv`

#### Step 2: Assign subsystem IDs

`02_lead_history_assign_subid.ipynb`

What it does:

- loads the reviewed cleaned history file
- compares each `system_name` against the existing history file
- reuses an existing resolved `PWSID` when the exact `system_name` already exists under the same base `PWSID`
- assigns a new suffix when the `system_name` is new

Outputs:

- `assign_pipeline/<workbook_name>_with_assigned_pwsid.csv`
- `assign_pipeline/<workbook_name>_proposed_mapping.csv`
- `assign_pipeline/<workbook_name>_assignment_review.csv`

#### Step 3: Merge into history

`03_lead_history_merge.ipynb`

What it does:

- merges the reviewed new history data with the existing history file
- checks for exact duplicates
- checks for unresolved conflicts under `pwsid + monitoring_end_date`
- exports the final history file only if checks pass

Outputs:

- `merge_pipeline/duplicate_rows_before_drop.csv`
- `merge_pipeline/merged_need_review.csv`
- `merge_pipeline/All_history_data_clean.csv`

---

### Part 2: LSLR / Inventory / Final Merge Pipeline

This workflow cleans LSLR data, cleans inventory data, and merges them with the final history dataset.

#### Notebook order

4. `01_LSLR_clean.ipynb`
5. `02_inventory_clean.ipynb`
6. `01_merge_history_lslr_inventory.ipynb`

#### Step 4: Clean LSLR workbook

`01_LSLR_clean.ipynb`

What it does:

- standardizes columns
- converts numeric fields
- removes rows missing critical fields
- removes exact duplicate rows
- groups records to `PWSID + year`

Outputs:

- `LSLR_clean_output/<lslr_name>_raw_clean.csv`
- `LSLR_clean_output/<lslr_name>_grouped_clean.csv`
- `LSLR_clean_output/<lslr_name>_exact_duplicates.csv`
- `LSLR_clean_output/<lslr_name>_pwsid_year_duplicates.csv`

Important note:

- The notebook does not assume a fixed year range.
- It uses whatever years are present in the input LSLR file.

#### Step 5: Clean inventory workbook

`02_inventory_clean.ipynb`

What it does:

- standardizes columns
- converts numeric fields
- removes rows missing `PWSID`
- removes exact duplicate rows
- preserves reported values as-is
- creates QA/checking fields

Outputs:

- `inventory_clean_output/<inventory_name>_clean.csv`
- `inventory_clean_output/<inventory_name>_duplicate_pwsid_rows.csv`
- `inventory_clean_output/<inventory_name>_exact_duplicates.csv`

Important note:

- Missing values are not inferred or filled.

#### Step 6: Final merge for visualization

`01_merge_history_lslr_inventory.ipynb`

What it does:

- merges the final history file, grouped LSLR file, and cleaned inventory file
- keeps history rows as the main grain
- preserves both `base_pwsid` and `resolved_pwsid`
- keeps `system_name` as the raw history name
- creates `display_name` for UI use
- merges LSLR on `base_pwsid + year`
- merges inventory on `base_pwsid`
- only populates inventory fields when `history.year == inventory_year`

Outputs:

- `merge_output/merged_history_lslr_inventory.csv`
- `merge_output/merged_history_lslr_inventory_exact_duplicates.csv`
- `merge_output/merged_history_lslr_inventory_summary.csv`

## Key Data Design Decisions

### 1. Base PWSID vs. resolved PWSID

Some water systems contain multiple subsystem names under the same original `PWSID`.

Because of this, the project uses:

- `base_pwsid`: the original utility-level ID
- `resolved_pwsid`: the subsystem-aware ID, such as `MI0000347-a`

### 2. No assumption-based name matching

If a system name changes over time, the pipeline does **not** assume that the new name corresponds to an older subsystem unless the exact `system_name` match already exists.

### 3. Inventory is treated as a single-year snapshot

Inventory data is merged using:

- `base_pwsid`
- a user-provided `inventory_year`

Inventory fields are only populated where:

- `history.year == inventory_year`

This makes the pipeline reusable for future inventory files from different years.

### 4. Monitoring detail is preserved

The final merged file keeps `monitoring_end_date` so that multiple valid monitoring periods within the same year are not incorrectly treated as duplicates.

## Repository Structure

A typical structure looks like this:

```text
Pipeline/
├── 01_lead_history_clean.ipynb
├── 02_lead_history_assign_subid.ipynb
├── 03_lead_history_merge.ipynb
├── clean_pipeline/
├── assign_pipeline/
└── merge_pipeline/

LSLR_Inventory_Pipeline/
├── 01_LSLR_clean.ipynb
├── 02_inventory_clean.ipynb
├── LSLR_clean_output/
└── inventory_clean_output/

merge_pipeline/
├── 01_merge_history_lslr_inventory.ipynb
└── merge_output/
