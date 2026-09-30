# CellAtlas

A local, English-language battery electrode material library and stack-design workspace. Current prototype: **v0.6**.

## Run

Download `index.html` and open it in Chrome or Edge. No build step, backend, or external dependency is required.

## Features

- Anode and cathode specifications with automatically calculated capacity bounds.
- Total mass loading for **both coating faces**, excluding the current collector.
- Recorded Al/Cu collector material, foil thickness in µm, and grade.
- Nominal and worst-case N/P assessment against editable limits.
- Live cathode sheet-count controls, stack thickness bounds, and guaranteed sheet counts.
- Anode–cathode combination matrix with fit, N/P rejection, and missing-data states.
- Material and design JSON import/export and comparison CSV export.

## Calculation conventions

- Per-face capacity: `C = (Utility / 100) × Cs × total loading / 20,000`, in mAh/cm². Both-face aggregate capacity is `2 × C`. Equal face loading is assumed.
- `Cmin/max = C × (1 ± capacity tolerance / 100)`.
- `N/P = C_anode / C_cathode`; worst case is `Cmin_anode / Cmax_cathode`.
- Each stack has `n` cathodes, `n + 1` anodes, and `2n + e` separator layers.
- Measured electrode total thickness includes the collector foil. Recorded foil thickness is **not added again**.
- Shared absolute or individual percentage thickness tolerances are supported. Maximum assembly thickness is compared with minimum housing space.
- Density is recorded; it does not determine stack thickness in this version.

The reference geometry reproduces the supplied calculation screenshot. Its shared tolerance basis, 0.201 mm × 2%, is an explicit editable assumption. Nonzero ZDW is not modeled, and drawing thickness is a reference only.

## Data and limitations

Data stays in browser local storage when available. Export JSON for backups; local storage is not shared between devices or browser origins. User-entered browser data is not included in this repository.

Demo material records are clearly labelled and are not supplier specifications. Acceptance criteria are user-defined engineering checks, not a cell safety assessment.

Calculation and interaction logic checks cover capacity conventions, N/P bounds, reference geometry, integer layer limits, material selection, foil metadata, and sheet controls. Full visual browser inspection has not been completed.

## Repository contents

- `index.html` — standalone application.
- `README.md` — usage, formulas, and prototype limits.

Uploading this repository does not enable GitHub Pages hosting.
