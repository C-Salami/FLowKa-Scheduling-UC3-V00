export type EntityKind = 'order' | 'operation';

export interface SelectionItem {
  kind: EntityKind;
  id: string;          // keep as string; parse if needed
  label?: string;      // optional display
}

export interface SelectionState {
  primary?: SelectionItem;     // “this”
  secondary?: SelectionItem;   // used for swap
  hovered?: SelectionItem;     // transient
  lastClicked?: SelectionItem; // for ~8s after click
}

export type SelectionListener = (s: SelectionState) => void;
