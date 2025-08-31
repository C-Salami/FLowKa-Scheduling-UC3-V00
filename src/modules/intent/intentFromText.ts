import { normalizeNumbers } from '@/modules/voice/numberNormalizer';
import { resolveDeixis } from '@/modules/voice/deixisResolver';
import { Intent } from './intentTypes';

function parseExplicitId(t: string) {
  const m = t.match(/\b(order|operation|op|id)\s*#?\s*(\d+)\b/i);
  if (!m) return undefined;
  const kind = m[1].toLowerCase().startsWith('op') ? 'operation' : (m[1].toLowerCase()==='operation'?'operation':'order');
  return { kind, id: m[2] };
}

function parseDelayBy(t: string) {
  const m1 = t.match(/\bby\s*(\d+)\s*(day|days|hour|hours)\b/i);
  const m2 = t.match(/\b(\d+)\s*(day|days|hour|hours)\b/i);
  if (m1 || m2) {
    const m = m1 ?? m2!;
    const n = parseInt(m[1],10);
    if (/hour/i.test(m[2])) return { hours: n };
    return { days: n };
  }
  const m3 = t.match(/\b(next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday)\b/i);
  if (m3) {
    return { dateISO: `REL:${m3[1].toLowerCase()}` };
  }
  return undefined;
}

function parseMoveTo(t: string) {
  const m = t.match(/\b(to|move to|schedule for)\s+(next monday|next tuesday|tomorrow|on \d{4}-\d{2}-\d{2})\b/i);
  if (!m) return undefined;
  return { dateISO: `REL:${m[2].toLowerCase()}` };
}

export function intentFromText(raw: string, source: 'speech'|'text') : Intent {
  const t = normalizeNumbers(raw).toLowerCase();
  const isDelay = /\b(delay|postpone|push)\b/.test(t);
  const isSwap  = /\b(swap|switch)\b/.test(t);
  const isMove  = /\b(move|reschedule|schedule)\b/.test(t);

  const explicit = parseExplicitId(t);
  const deictic = resolveDeixis(t);

  if (isSwap) {
    return {
      kind: 'SWAP',
      source, raw,
      a: explicit ? { id: explicit.id, kind: explicit.kind as any } :
         deictic.pair ? { id: deictic.pair[0].id, kind: deictic.pair[0].kind } : undefined,
      b: deictic.pair ? { id: deictic.pair[1].id, kind: deictic.pair[1].kind } : undefined,
    };
  }

  if (isDelay) {
    const by = parseDelayBy(t);
    return {
      kind: 'DELAY',
      source, raw,
      target: explicit ? { id: explicit.id, kind: explicit.kind as any } :
              deictic.single ? { id: deictic.single.id, kind: deictic.single.kind } : {},
      by
    };
  }

  if (isMove) {
    const to = parseMoveTo(t);
    return {
      kind: 'MOVE',
      source, raw,
      target: explicit ? { id: explicit.id, kind: explicit.kind as any } :
              deictic.single ? { id: deictic.single.id, kind: deictic.single.kind } : {},
      to
    };
  }

  return { kind: 'UNKNOWN', source, raw };
}
