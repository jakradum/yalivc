# LP Portal Schema Migration Guide

This guide walks through migrating the quarterly update data from the old structure (`lpCompanyQuarterUpdate` documents) to the new consolidated structure (embedded in `lpInvestment`).

## Overview

**Old Structure:**
- `lpInvestment` → Investment details
- `lpCompanyQuarterUpdate` → Separate documents for each quarter
- `lpQuarterlyReport.portfolioCompanyUpdates[]` → References to lpCompanyQuarterUpdate

**New Structure:**
- `lpInvestment` → Investment details + **quarterlyUpdates[]** array (all quarters embedded)
- `lpQuarterlyReport.portfolioCompanies[]` → References directly to lpInvestment

## Prerequisites

1. Make sure you have a `SANITY_API_TOKEN` in your `.env.local` file with write permissions
2. Install dependencies if not already done: `npm install`

## Migration Steps

### Step 1: Migrate Quarterly Data into lpInvestment

This script moves all quarterly update data from `lpCompanyQuarterUpdate` documents into the `quarterlyUpdates[]` array within their parent `lpInvestment` documents.

```bash
node scripts/migrate-quarterly-data.mjs
```

**What it does:**
- Fetches all `lpCompanyQuarterUpdate` documents
- Groups them by their associated investment
- Updates each `lpInvestment` with a `quarterlyUpdates[]` array containing all its quarterly data

**This script is safe to run multiple times** - it will overwrite the `quarterlyUpdates` array each time.

### Step 2: Update Quarterly Report References

This script updates `lpQuarterlyReport` documents to reference `lpInvestment` directly instead of `lpCompanyQuarterUpdate`.

```bash
node scripts/migrate-report-references.mjs
```

**What it does:**
- Fetches all `lpQuarterlyReport` documents
- Extracts the investment IDs from their old `portfolioCompanyUpdates` references
- Creates new `portfolioCompanies[]` references pointing directly to `lpInvestment`

**This script is safe to run multiple times** - it will overwrite the `portfolioCompanies` array each time.

### Step 3: Verify Migration

1. Go to Sanity Studio at `/console`
2. Open an `LP Investment` document
3. Check the "Quarterly Performance" tab - you should see all quarters listed
4. Open an `LP Quarterly Report` document
5. Check that `Portfolio Companies in Report` field shows the companies

### Step 4: Update Frontend Code

The GROQ queries have been updated to use the new structure. Deploy the changes and verify the portal still works.

### Step 5: Cleanup (Optional)

After verifying everything works:

1. **Delete old lpCompanyQuarterUpdate documents** from Sanity
2. **Remove the old field** `portfolioCompanyUpdates` from `lpQuarterlyReport` schema (currently kept for safety)
3. **Delete the lpCompanyQuarterUpdate schema** from `src/sanity/schemas/`

## Rollback

If something goes wrong:

1. The old `lpCompanyQuarterUpdate` documents are NOT deleted by the migration
2. The old `portfolioCompanyUpdates` field is NOT removed from reports
3. You can revert the schema changes and redeploy the old code

## Troubleshooting

**Error: "Missing SANITY_API_TOKEN"**
- Add your Sanity API token to `.env.local`:
  ```
  SANITY_API_TOKEN=your_token_here
  ```
- Get a token from: https://manage.sanity.io/

**Error: "Permission denied"**
- Make sure your token has "Editor" or "Admin" permissions

**Data looks wrong after migration**
- The scripts are idempotent - you can run them again to re-migrate
- Check the Sanity Studio to see the actual data structure

## Questions?

Contact the dev team or check the Sanity documentation.
