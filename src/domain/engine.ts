import { bounds } from './types.ts';
import type { Dataset, Dimension, Electrode, Material, Plan } from './types.ts';
export const ENGINE_VERSION = '7.0.0';
export type Contribution = { name: string; count: number; nominal: number; min: number; max: number; kind: 'cathode' | 'anode' | 'mechanical' | 'clearance' };
export function capacity(e: Electrode, m: Material) {
  if (e.utility == null || e.loading == null || m.cs == null) throw Error(`Capacity data is missing for ${e.name}.`);
  if (e.utility <= 0 || e.utility > 100 || m.cs <= 0 || bounds(e.loading).min <= 0) throw Error('Utility, Cs and loading must have positive lower bounds.');
  const factor = e.utility / 100 * m.cs / 20000, l = bounds(e.loading);
  return { nominal: l.nominal * factor, min: l.min * factor, max: l.max * factor, bothFaces: l.nominal * factor * 2 };
}
function required<T extends { id: string }>(rows: T[], id: string, label: string): T { const r = rows.find(x => x.id === id); if (!r) throw Error(`Missing pinned ${label} revision: ${id}`); return r; }
function term(name: string, count: number, d: Dimension, kind: Contribution['kind']): Contribution { const b = bounds(d); return { name, count, nominal: count * b.nominal, min: count * b.min, max: count * b.max, kind }; }
export function evaluate(plan: Plan, data: Dataset) {
  const cathode = required(data.electrodes, plan.cathodeId, 'cathode'), anode = required(data.electrodes, plan.anodeId, 'anode'), cm = required(data.materials, cathode.materialId, 'material'), am = required(data.materials, anode.materialId, 'material');
  if (cm.electrodeType !== 'Cathode' || am.electrodeType !== 'Anode') throw Error('Select a cathode and an anode electrode revision.');
  if (!cathode.thickness || !anode.thickness) throw Error('Enter measured electrode thicknesses before sizing a stack.');
  const bom = required(data.boms, plan.bomId, 'BOM'), housing = required(data.parts, bom.housingId, 'housing');
  if (!housing.internalSpace) throw Error('Housing internal space is missing.');
  const space = bounds(housing.internalSpace), tc = cathode.thickness, ta = anode.thickness;
  if (!bom.items.some(item => item.usage === 'perSeparatorLayer' && required(data.parts, item.partId, 'part').role === 'Separator')) throw Error('BOM must include a separator with per-separator-layer usage.');
  const contributions = (n: number): Contribution[] => {
    const terms: Contribution[] = [term('Cathode electrodes', n * plan.stacks, tc, 'cathode'), term('Anode electrodes', (n + 1) * plan.stacks, ta, 'anode')];
    for (const item of bom.items) { const part = required(data.parts, item.partId, 'part'); if (item.usage === 'inventoryOnly') continue; const count = item.quantity * (item.usage === 'perStack' ? plan.stacks : item.usage === 'perSeparatorLayer' ? (2 * n + plan.extraSeparatorLayers) * plan.stacks : 1); terms.push(term(part.name, count, part.thickness, 'mechanical')); }
    terms.push(term('Internal stack clearance', plan.stacks, plan.stackClearance, 'clearance'), term('Assembly clearance', 1, plan.assemblyClearance, 'clearance')); return terms;
  };
  const sum = (n: number, key: 'min' | 'nominal' | 'max') => contributions(n).reduce((a, r) => a + r[key], 0);
  const maxCount = (worst: boolean) => { const key = worst ? 'max' : 'nominal', step = sum(1, key) - sum(0, key); if (step <= 0) throw Error('Stack thickness per sheet must be positive.'); return Math.max(0, Math.floor(((worst ? space.min : space.nominal) - sum(0, key) + 1e-9) / step)); };
  const maximumNominal = maxCount(false), maximumGuaranteed = maxCount(true), sheets = plan.mode === 'automatic' ? maximumGuaranteed : plan.sheets;
  if (sheets < 1) throw Error('No complete stack fits within the entered worst-case limits.');
  const terms = contributions(sheets), total = { min: sum(sheets, 'min'), nominal: sum(sheets, 'nominal'), max: sum(sheets, 'max') };
  let np: { nominal: number; min: number; max: number } | null = null, cathodeCapacity: ReturnType<typeof capacity> | null = null, capacityError = '';
  try { cathodeCapacity = capacity(cathode, cm); const a = capacity(anode, am); np = { nominal: a.nominal / cathodeCapacity.nominal, min: a.min / cathodeCapacity.max, max: a.max / cathodeCapacity.min }; } catch (e) { capacityError = (e as Error).message; }
  const margin = { min: space.min - total.max, nominal: space.nominal - total.nominal, max: space.max - total.min }, fits = margin.min >= -1e-9;
  const meetsNp = np != null && np.min >= plan.minimumNp - 1e-12 && (plan.maximumNp == null || np.max <= plan.maximumNp + 1e-12);
  const reasons: string[] = []; if (!fits) reasons.push(`Worst-case assembly exceeds housing by ${(-margin.min).toFixed(3)} mm. Use at most ${maximumGuaranteed} cathodes per stack.`); if (!np) reasons.push(capacityError); else if (!meetsNp) reasons.push(`N/P interval ${np.min.toFixed(3)}–${np.max.toFixed(3)} is outside the specified limits.`);
  return { engineVersion: ENGINE_VERSION, sheets, stacks: plan.stacks, total, space, margin, np, cathodeCapacity, fits, meetsNp, status: !np ? 'missing' : !fits ? 'overpacked' : !meetsNp ? 'np-limit' : 'pass', reasons, contributions: terms, maximumNominal, maximumGuaranteed, toleranceSpan: total.max - total.min, upperDeviation: total.max - total.nominal, lowerDeviation: total.nominal - total.min, capacityLowerAh: cathodeCapacity && plan.overlapAreaCm2 ? 2 * sheets * plan.stacks * plan.overlapAreaCm2 * cathodeCapacity.min / 1000 : null };
}
