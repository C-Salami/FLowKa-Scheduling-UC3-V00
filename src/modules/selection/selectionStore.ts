import { SelectionItem, SelectionListener, SelectionState } from './selectionTypes';

class SelectionStore {
  private state: SelectionState = {};
  private listeners = new Set<SelectionListener>();

  subscribe(fn: SelectionListener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  getState() { return this.state; }
  private emit() { this.listeners.forEach(fn => fn(this.state)); }

  clearAll() {
    this.state = {};
    this.emit();
  }

  setPrimary(item: SelectionItem) {
    const sameAsSecondary = this.state.secondary && this.state.secondary.id === item.id && this.state.secondary.kind === item.kind;
    this.state = { ...this.state, primary: item, secondary: sameAsSecondary ? undefined : this.state.secondary, lastClicked: item };
    this.emit();
  }

  setSecondary(item: SelectionItem) {
    if (!this.state.primary || (this.state.primary.id === item.id && this.state.primary.kind === item.kind)) return;
    this.state = { ...this.state, secondary: item, lastClicked: item };
    this.emit();
  }

  setHovered(item?: SelectionItem) {
    this.state = { ...this.state, hovered: item };
    this.emit();
  }

  shiftClick(item: SelectionItem) {
    if (!this.state.primary) this.setPrimary(item);
    else if (!this.state.secondary && (this.state.primary.id !== item.id || this.state.primary.kind !== item.kind)) this.setSecondary(item);
    else {
      this.state = { ...this.state, secondary: item, lastClicked: item };
      this.emit();
    }
  }
}

export const selectionStore = new SelectionStore();
