# FLowKa-Scheduling-UC3-V01 — Selection + Voice Deixis Patch

This patch adds:
- A global selection store (primary/secondary/hover/lastClicked)
- Chart ↔ selection glue (click/shift-click/hover)
- Voice/text command parsing with "this/these" resolution
- A tiny number normalizer for ASR quirks
- An intent dispatcher that falls back to current selection
- Optional Selection Tray UI

## Files
- `src/modules/selection/selectionTypes.ts`
- `src/modules/selection/selectionStore.ts`
- `src/ui/components/ChartSelectionAdapter.ts`
- `src/modules/voice/numberNormalizer.ts`
- `src/modules/voice/deixisResolver.ts`
- `src/modules/intent/intentTypes.ts`
- `src/modules/intent/intentFromText.ts`
- `src/modules/commands/dispatcher.ts`
- `src/app/speechController.ts`
- `src/ui/components/SelectionTray.tsx`
- `src/ui/components/ContextMenu.tsx` (optional)

## Wire-up checklist
1. **Chart**: On bar click → `onChartItemClick(bar, ev.shiftKey||ev.ctrlKey)`. On hover → `onChartItemHover(barOrNull)`.
2. **Speech**: Call `onSpeechFinalTranscript(text)` when ASR finalizes.
3. **Command box**: On submit → `onCommandSubmit(text)`.
4. **UI**: Render `<SelectionTray />` once near app root.
5. **APIs**: Replace TODOs in `dispatcher.ts` with your actual backend calls.

## Smoke tests
- Click an order → type “delay this by 2 days” → see `apiDelay(order, id, {days:2})`.
- Shift-click two orders → say “swap orders” → see `apiSwap(order, a, b)`.
- Hover an order (no selection) → say “move this to next Monday” → see `apiMove(order, id, {dateISO:'REL:next monday'})`.

## Notes
- If you support operations as well as orders, pass the correct `kind` from your chart in the adapter.
- Replace the placeholder toast and API functions with your app’s implementations.
