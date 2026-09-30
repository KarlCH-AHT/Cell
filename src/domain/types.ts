export type Dimension = { nominal: number; minus: number; plus: number };
export type Version = { id: string; lineageId: string; revision: number; name: string; createdAt: string; source: string; notes: string };
export type Material = Version & { electrodeType: 'Cathode' | 'Anode'; chemistry: string; supplier: string; cs: number | null };
export type Electrode = Version & { materialId: string; utility: number | null; loading: Dimension | null; density: number | null; thickness: Dimension | null; collectorMaterial: 'Al' | 'Cu' | 'Other' | 'Unknown'; collectorThicknessUm: number | null; collectorGrade: string };
export type Part = Version & { role: 'Housing' | 'Separator' | 'Insulation' | 'Lid' | 'Terminal' | 'Collector' | 'Other'; partNumber: string; material: string; supplier: string; drawing: string; thickness: Dimension; internalSpace: Dimension | null; width: number | null; height: number | null };
export type Usage = 'perCell' | 'perStack' | 'perSeparatorLayer' | 'inventoryOnly';
export type Bom = Version & { housingId: string; items: { partId: string; quantity: number; usage: Usage }[] };
export type Plan = Version & { cathodeId: string; anodeId: string; bomId: string; mode: 'specified' | 'automatic'; sheets: number; stacks: number; extraSeparatorLayers: number; stackClearance: Dimension; assemblyClearance: Dimension; overlapAreaCm2: number | null; minimumNp: number; maximumNp: number | null };
export type Dataset = { schemaVersion: 7; materials: Material[]; electrodes: Electrode[]; parts: Part[]; boms: Bom[]; plans: Plan[] };
export type Collection = 'materials' | 'electrodes' | 'parts' | 'boms' | 'plans';
export const collections: Collection[] = ['materials', 'electrodes', 'parts', 'boms', 'plans'];
export type Entity = Material | Electrode | Part | Bom | Plan;
export type StoredDataset = { version: number; data: Dataset };
export const dimension = (nominal: number, minus = 0, plus = minus): Dimension => ({ nominal, minus, plus });
export const bounds = (d: Dimension) => ({ min: d.nominal - d.minus, nominal: d.nominal, max: d.nominal + d.plus });
export function newVersion<T extends Version>(value: T, siblings: Version[]): T {
  const revision = Math.max(0, ...siblings.filter(r => r.lineageId === value.lineageId).map(r => r.revision)) + 1;
  return { ...value, id: crypto.randomUUID(), revision, createdAt: new Date().toISOString() };
}
export function initialVersion(name: string): Version { return { id: crypto.randomUUID(), lineageId: crypto.randomUUID(), revision: 1, name, createdAt: new Date().toISOString(), source: '', notes: '' }; }
export function latest<T extends Version>(values: T[]): T[] {
  const map = new Map<string, T>();
  for (const v of values) if (!map.has(v.lineageId) || map.get(v.lineageId)!.revision < v.revision) map.set(v.lineageId, v);
  return [...map.values()];
}
