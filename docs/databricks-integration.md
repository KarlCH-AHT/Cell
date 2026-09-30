# Future Databricks integration boundary

The current application uses IndexedDB. `HttpRepository` is supplied as a replaceable frontend adapter; no cloud connection or application backend is deployed.

## Backend API contract

- `GET /dataset` → `{version: integer, data: Dataset}`; 404 means no dataset initialized.
- `PUT /dataset`, body `{data: Dataset}`, `If-Match: <expected version>` → `{version: new integer}`.
- Conflict responses: 409 or 412. Use the authenticated application session; `HttpRepository` includes cookies. The backend must enforce authorization, validate input and enforce immutable revisions itself.

The frontend currently transports a complete revision snapshot. The backend may implement normalized append operations internally; it must not blindly overwrite entire tables or delete historical revisions. A future incremental API can implement the same repository semantics without changing the calculation engine.

## Table mapping proposal

Separate engineering revision tables for materials, electrode specifications, mechanical components, mechanical BOMs/BOM items, and cell plans. Keep revision ID, lineage ID, revision number and timestamps as explicit columns; persist references as revision IDs. Dimension columns must keep nominal, lower and upper deviation and their units explicit. Include source and notes.

A backend version/snapshot manifest is required for optimistic concurrency. How to commit multiple tables and the manifest consistently depends on the chosen Databricks services; the app does not assume that several SQL writes automatically form an atomic transaction. Implement and test that guarantee before enabling writes. JSON backups are interchange, not a substitute for typed table mapping.

## Authentication and deployment still to decide

Choose the workspace/cloud, catalog/schema, application identity, user permission model and write path. Databricks credentials belong exclusively in the backend or its identity layer, never in `VITE_*` variables, browser local storage, or this public repository. Use an authenticated HTTPS application API; production cookie/CSRF policy is backend work.

The official SQL Statement Execution API is one available server-side integration path; it is not an implemented connector here. Verify its asynchronous execution and result handling when implementing the backend.

Official references:
- https://docs.databricks.com/aws/en/dev-tools/sql-execution-tutorial
- https://docs.databricks.com/api/statement-execution/v1/statement-execution

## Migration sequence

1. Confirm the v7 engineering schema and units with production data.
2. Implement backend identity, immutable revision validation and concurrency tests.
3. Map the engineering collections to the chosen tables; round-trip a known reference fixture.
4. Enable `HttpRepository` through explicit application configuration.
5. Test concurrent edits, failed writes, historical-plan stability and export recovery.

No frontend cloud-storage toggle is shown until a backend is configured and verified.
