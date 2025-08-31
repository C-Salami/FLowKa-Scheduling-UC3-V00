export type IntentKind = 'DELAY' | 'SWAP' | 'MOVE' | 'SPLIT' | 'UNKNOWN';

export interface BaseIntent { kind: IntentKind; source: 'speech'|'text'|'ui'; raw: string; }

export interface DelayIntent extends BaseIntent {
  kind: 'DELAY';
  target: { id?: string; kind?: 'order'|'operation' };
  by?: { days?: number; hours?: number; dateISO?: string };
}

export interface SwapIntent extends BaseIntent {
  kind: 'SWAP';
  a?: { id?: string; kind?: 'order'|'operation' };
  b?: { id?: string; kind?: 'order'|'operation' };
}

export interface MoveIntent extends BaseIntent {
  kind: 'MOVE';
  target: { id?: string; kind?: 'order'|'operation' };
  to: { dateISO?: string };
}

export type Intent = DelayIntent | SwapIntent | MoveIntent | BaseIntent;
