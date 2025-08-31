import { selectionStore } from '@/modules/selection/selectionStore';
import { SelectionItem } from '@/modules/selection/selectionTypes';

export interface DeicticTargets {
  single?: SelectionItem;
  pair?: [SelectionItem, SelectionItem];
  kindHint?: 'order'|'operation';
}

export function resolveDeixis(transcript: string): DeicticTargets {
  const t = transcript.toLowerCase();
  const s = selectionStore.getState();

  const mentionsOrder = /\border(s)?\b/.test(t);
  const mentionsOperation = /\b(operation|op)\b/.test(t);
  const kindHint = mentionsOrder ? 'order' : (mentionsOperation ? 'operation' : undefined);

  const saysThis = /\b(this|that|selected|current)\b/.test(t);
  const saysThese = /\b(these|both)\b/.test(t);
  const saysFirstSecond = /\b(first|second|other)\b/.test(t);

  const primary = s.primary ?? s.hovered ?? s.lastClicked;
  const secondary = s.secondary;

  const kmatch = (x?: SelectionItem) => x && (!kindHint || x.kind === kindHint) ? x : undefined;

  if (saysThese || /swap /.test(t)) {
    if (kmatch(primary) && kmatch(secondary)) return { pair: [primary!, secondary!], kindHint };
    return { pair: undefined, kindHint };
  }

  if (saysThis || saysFirstSecond || !/\b(order|operation|op|id)\b/.test(t)) {
    if (kmatch(primary)) return { single: primary!, kindHint };
    if (kmatch(s.hovered)) return { single: s.hovered!, kindHint };
    if (kmatch(s.lastClicked)) return { single: s.lastClicked!, kindHint };
  }

  return { kindHint };
}
