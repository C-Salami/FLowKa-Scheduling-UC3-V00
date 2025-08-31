import { intentFromText } from '@/modules/intent/intentFromText';
import { dispatchIntent } from '@/modules/commands/dispatcher';

// Call this from wherever your ASR engine returns final text
export async function onSpeechFinalTranscript(text: string) {
  const intent = intentFromText(text, 'speech');
  await dispatchIntent(intent);
}

// If you also have a typed command input, route it here too.
export async function onCommandSubmit(text: string) {
  const intent = intentFromText(text, 'text');
  await dispatchIntent(intent);
}
