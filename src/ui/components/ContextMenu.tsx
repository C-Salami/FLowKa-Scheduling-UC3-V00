import React from 'react';
import { selectionStore } from '@/modules/selection/selectionStore';
import { dispatchIntent } from '@/modules/commands/dispatcher';

export function openContextMenuFor(item: { kind:'order'|'operation'; id:string }) {
  selectionStore.setPrimary(item);
  const choice = window.prompt('Type: delay 2d | swap (needs second selection) | move next monday');
  if (!choice) return;
  const text = choice.replace('2d', '2 days').replace('next monday','move to next monday');
  import('@/modules/intent/intentFromText').then(async ({ intentFromText }) => {
    const intent = intentFromText(text, 'text');
    await dispatchIntent(intent);
  });
}
