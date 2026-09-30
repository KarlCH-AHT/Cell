import type { Dataset, StoredDataset } from '../domain/types.ts';
export interface Repository { load(): Promise<StoredDataset | null>; save(data: Dataset, expectedVersion: number): Promise<number> }
// The UI and domain engine depend only on this contract. No Databricks secret belongs in the browser.
