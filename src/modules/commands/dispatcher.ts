import { Intent } from '@/modules/intent/intentTypes';
import { selectionStore } from '@/modules/selection/selectionStore';

// Replace these with your real API calls
async function apiDelay(kind: 'order'|'operation', id: string, payload: { days?:number; hours?:number; dateISO?:string }) { /* TODO: plug API */ }
async function apiSwap(kind: 'order'|'operation', a: string, b: string) { /* TODO: plug API */ }
async function apiMove(kind: 'order'|'operation', id: string, payload: { dateISO?:string }) { /* TODO: plug API */ }

// Replace with your app’s toast/dialog system
const toast = (m: string) => console.info('[toast]', m);

export async function dispatchIntent(intent: Intent) {
  switch (intent.kind) {
    case 'DELAY': {
      const id = intent.target.id ?? selectionStore.getState().primary?.id;
      const kind = (intent.target.kind ?? selectionStore.getState().primary?.kind) as ('order'|'operation'|undefined);
      if (!id || !kind) return toast('Select an item (or say “delay **this** by 2 days”).');
      if (!intent.by) return toast('Specify duration, e.g., “by 2 days”.');
      await apiDelay(kind, id, intent.by);
      toast(`Delayed ${kind} #${id}.`);
      return;
    }
    case 'SWAP': {
      const s = selectionStore.getState();
      const a = intent.a?.id ?? s.primary?.id;
      const b = intent.b?.id ?? s.secondary?.id;
      const kind = (intent.a?.kind ?? s.primary?.kind) as ('order'|'operation'|undefined);
      if (!a || !b || !kind) return toast('Pick two items to swap (shift-click two).');
      await apiSwap(kind, a, b);
      toast(`Swapped ${kind} #${a} with #${b}.`);
      return;
    }
    case 'MOVE': {
      const id = intent.target.id ?? selectionStore.getState().primary?.id;
      const kind = (intent.target.kind ?? selectionStore.getState().primary?.kind) as ('order'|'operation'|undefined);
      if (!id || !kind) return toast('Select an item (or say “move **this** to next Monday”).');
      if (!intent.to?.dateISO) return toast('Give a date, e.g., “to next Monday”.');
      await apiMove(kind, id, intent.to);
      toast(`Moved ${kind} #${id}.`);
      return;
    }
    default:
      toast('Sorry, I did not catch that. Try “delay this by 2 days” or “swap orders”.');
  }
}
