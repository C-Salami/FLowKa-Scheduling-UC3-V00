import { selectionStore } from '@/modules/selection/selectionStore';
import { SelectionItem } from '@/modules/selection/selectionTypes';

// Call these from your chart library handlers
export function onChartItemClick(raw: { kind: 'order'|'operation'; id: string; label?: string; }, multi = false) {
  const item: SelectionItem = { kind: raw.kind, id: String(raw.id), label: raw.label };
  if (multi) selectionStore.shiftClick(item);
  else selectionStore.setPrimary(item);
}

export function onChartItemHover(raw?: { kind: 'order'|'operation'; id: string; label?: string; }) {
  if (!raw) { selectionStore.setHovered(undefined); return; }
  selectionStore.setHovered({ kind: raw.kind, id: String(raw.id), label: raw.label });
}
