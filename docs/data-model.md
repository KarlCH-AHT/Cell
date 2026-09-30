# Data model and revision rules

Every record has `id` (immutable revision ID), `lineageId` (stable record family), integer `revision`, `createdAt`, name, source and notes. References always target `id`, never “latest”. New revisions are appended; edits and removal of persisted revisions are rejected.

| Collection | Parameters | Pinned references |
| --- | --- | --- |
| materials | Electrode family, chemistry, supplier, Cs in mAh/g | None |
| electrodes | Utility %, both-face dry loading g/m², coating density g/cm³, measured total thickness mm, collector material and thickness µm, grade | materialId |
| parts | Role, part number, material, supplier, drawing reference, thickness mm, width/height mm, housing internalSpace mm | None |
| boms | Housing selection, part quantities and usage rules | housingId; items[].partId |
| plans | Layer mode, sheet/stack count, extra separator layers, clearance dimensions, N/P limits, overlap area cm² | cathodeId, anodeId, bomId |

A dimension is `{nominal, minus, plus}`: lower bound is `nominal-minus`, upper bound is `nominal+plus`. Deviations are nonnegative absolute values in the field unit. Unknown electrode loading or thickness is `null`, not zero. Housing internalSpace is already net internal usable space: wall metadata is not subtracted again.

A BOM instance quantity is multiplied by one of: 1 per cell; stack count per stack; `(2*n+extra)*stackCount` per separator layer. Inventory-only records retain mechanical information without contributing thickness. Only dimensions along the stack axis should be included in the stack envelope. CAD attachments and arbitrary geometric interference are not implemented.

A saved plan references a BOM revision, which itself references specific housing/part revisions. Updating a part therefore requires a new BOM revision, and selecting it requires a new plan revision. This is deliberate traceability.

The calculation engine preserves unrounded intermediate values. Rounding is presentation only. Contributions contain their effective quantities, min/nominal/max thicknesses and tolerance span. There is no statistical probability distribution implicit in these bounds.

Local database metadata carries an integer optimistic-concurrency version. This is distinct from individual engineering record revisions. IndexedDB saves all changes in one transaction and checks the expected database version first.
