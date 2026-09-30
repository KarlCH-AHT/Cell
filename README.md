# CellAtlas

Versioned battery-material, electrode and mechanical-BOM workspace. **v0.7** uses React, TypeScript and Vite, with a separate calculation engine and IndexedDB repository.

## Run locally

Use Node.js 22.12+ (Node 24 tested).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. `npm run build` type-checks and produces `dist/`; `npm run preview` serves that build. A static server is required for the React app. The previous standalone app is retained at `legacy/v0.6.html`.

## Workflow

1. **Materials:** chemistry, supplier, Cs and source/test basis.
2. **Electrode specifications:** pinned material revision, Utility, total two-face dry coating loading, collector Al/Cu foil and grade, density, measured total thickness.
3. **Mechanical components:** part number, material, drawing reference and dimensional bounds. Housing wall thickness and available internal stack space are separate fields.
4. **Mechanical BOMs:** pinned housing and part revisions, with per-cell, per-stack, per-separator-layer or inventory-only usage.
5. **Cell plans:** pinned electrode and BOM revisions, specified or automatic sheet count, stack count, clearances, active overlap area and N/P limits.

“Create next revision” preserves existing records. Historical plans continue to use their original revision IDs. Changing a library record does not silently update dependent electrodes, BOMs or plans. A plan must explicitly select the newer revision to adopt it.

## Tolerances and calculations

Dimensional inputs use **nominal, lower deviation and upper deviation**, in absolute units. An optional percentage helper converts to those explicit deviations. Loading uses g/m²; geometry uses mm; collector metadata uses µm.

- Loading is the total dry coating mass of both faces, excluding foil. Equal face loading is assumed.
- Per-face capacity: `C = Utility/100 × Cs × total loading/20000`.
- Capacity bounds follow the entered loading bounds; no additional Cs or Utility variation is inferred.
- Nominal N/P is `C_anode/C_cathode`; worst case is `Cmin_anode/Cmax_cathode`.
- Each stack has `n` cathodes, `n+1` anodes, and `2n+extra` separator layers.
- Measured electrode thickness includes foil. Collector metadata is not added again.
- Automatic mode maximizes the integer cathode count using maximum assembly thickness and minimum internal housing space.
- The dynamic chart shows minimum, nominal and maximum thickness, the free-space interval, and each contribution to the tolerance envelope.

The reference fixture reproduces the supplied spreadsheet: nominal assembly **29.074 mm**, maximum **29.66092 mm**, minimum **28.48708 mm**, nominal maximum **35** cathodes per stack and guaranteed maximum **34**. Electrode deviations are explicitly ±0.00402 mm; their source basis is a screenshot-reproduction assumption. Reference anode chemistry/capacity and foil specifications are illustrative.

This is a deterministic tolerance envelope. Statistical distributions, correlations, yield and nonzero ZDW are not modeled. Density is recorded, not used to replace measured thickness. N/P criteria are user-defined engineering checks, not safety certification.

## Local data and imports

IndexedDB stores normalized immutable revisions. Explicit saves are transactional; stale writes from another tab are rejected. Live design edits are drafts until **Save plan revision** is clicked. Export the full backup for portable recovery.

- Import schemaVersion 7 backups to merge immutable revisions.
- Import legacy materials JSON to split material and electrode records. Legacy calculated capacities are ignored; missing thickness/tolerance data stays unknown.
- Legacy standalone design JSON is not automatically converted because the old global tolerance model differs; recreate it as a versioned plan.
- Review exports contain the draft, result and pinned dataset; use a full backup for re-import.
- Browser data from the old file origin is not automatically transferred to a new Vite origin. Export/import it deliberately.

## Databricks preparation

`src/storage/repository.ts` is the storage contract. The default is IndexedDB; `HttpRepository` is an optional adapter for a future application backend. No Databricks endpoint, token or cloud table is configured. Backend authentication, Unity Catalog/table mapping and concurrency implementation remain deployment work.

See [data model](docs/data-model.md) and [backend contract](docs/databricks-integration.md). The frontend must not carry Databricks credentials. Uploading this repository does not deploy a website.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

Browser checks require a Chromium installation (`npx playwright install chromium`). Set `CELLATLAS_CHROMIUM_PATH` to an existing executable when needed. The browser test launches a local production preview and checks real IndexedDB persistence and revision behavior.

Source layout: `src/domain` contains models, validation, import and calculations; `src/storage` contains repository adapters; `src/components` and `src/App.tsx` contain the English UI. `package-lock.json` pins resolved dependencies.

Browser verification uses Chromium: run `npx playwright install chromium` once, then `npm run test:browser`. For an existing Chromium binary, set `CHROMIUM_EXECUTABLE`. GitHub Actions runs the calculation, storage, build and browser checks.
