import React from 'react';
import { selectionStore } from '@/modules/selection/selectionStore';

export function SelectionTray() {
  const [s, setS] = React.useState(selectionStore.getState());
  React.useEffect(() => selectionStore.subscribe(setS), []);

  if (!s.primary && !s.secondary) return null;

  return (
    <div className="fixed bottom-4 right-4 rounded-2xl shadow p-3 bg-white border flex items-center gap-3">
      {s.primary && (
        <span className="px-2 py-1 rounded-lg bg-gray-100">
          Primary: {s.primary.kind} #{s.primary.id}
        </span>
      )}
      {s.secondary && (
        <span className="px-2 py-1 rounded-lg bg-gray-100">
          Secondary: {s.secondary.kind} #{s.secondary.id}
        </span>
      )}
      <button className="px-2 py-1 rounded-lg border" onClick={() => selectionStore.clearAll()}>
        Clear
      </button>
    </div>
  );
}
