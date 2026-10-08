/**
 * The only place that talks to the speech recognizer. Expo Go does not ship
 * this native module, so it is loaded optionally: without it (or without a
 * recognizer on the phone, or without mic permission) `available` is false and
 * the caller falls back to the keyboard's own mic.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { copy } from '../ui/copy';

type Mod = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;
type Sub = { remove(): void };

const mod: Mod | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('expo-speech-recognition') as typeof import('expo-speech-recognition')).ExpoSpeechRecognitionModule;
  } catch {
    return null;
  }
})();

const NORMAL_ENDINGS = new Set(['no-speech', 'aborted', 'speech-timeout']);

function recognizerReady(): boolean {
  try {
    return !!mod && mod.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export type Dictation = {
  /** False means: send the person to the keyboard mic instead. */
  available: boolean;
  listening: boolean;
  /** What has been heard so far in this session, for live feedback. */
  heard: string;
  start(): Promise<boolean>;
  stop(): void;
};

/**
 * Listens until the person stops talking (or taps again) and hands over the final
 * transcript once. One utterance per tap; a few seconds of silence ends it.
 */
export function useDictation(onFinal: (transcript: string) => void, onProblem?: (note: string) => void): Dictation {
  const [available, setAvailable] = useState(recognizerReady);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const finals = useRef<string[]>([]);
  const subs = useRef<Sub[]>([]);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const onProblemRef = useRef(onProblem);
  onProblemRef.current = onProblem;

  const cleanup = useCallback(() => {
    for (const s of subs.current) s.remove();
    subs.current = [];
  }, []);

  useEffect(() => () => {
    cleanup();
    try { mod?.abort(); } catch { /* already stopped */ }
  }, [cleanup]);

  const start = useCallback(async () => {
    if (!mod || !recognizerReady()) {
      setAvailable(false);
      return false;
    }
    const perm = await mod.requestPermissionsAsync().catch(() => ({ granted: false }));
    if (!perm.granted) {
      setAvailable(false);
      return false;
    }
    cleanup();
    finals.current = [];
    setHeard('');
    let failure: string | null = null;
    subs.current = [
      mod.addListener('result', (e) => {
        const text = e.results[0]?.transcript ?? '';
        if (e.isFinal) finals.current.push(text);
        setHeard([...finals.current, e.isFinal ? '' : text].join(' ').trim());
      }),
      mod.addListener('error', (e) => {
        // "no-speech" and "aborted" are normal endings, not failures.
        if (NORMAL_ENDINGS.has(e.error)) return;
        failure = e.error;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'language-not-supported') setAvailable(false);
      }),
      mod.addListener('end', () => {
        cleanup();
        setListening(false);
        const text = finals.current.join(' ').trim();
        finals.current = [];
        setHeard('');
        if (text) return onFinalRef.current(text);
        if (failure) return onProblemRef.current?.(copy.voiceFailed(failure));
        onFinalRef.current('');
      }),
    ];
    try {
      mod.start({
        lang: 'en-US',
        interimResults: true,
        // The phone's own recognizer with its own mic, the same path as keyboard dictation.
        // Continuous mode and forced on-device recognition make the library record the mic itself
        // and pipe it in, which real phones reject with a "client" error. One utterance per tap,
        // with a long silence allowance so people can think between items.
        continuous: false,
        addsPunctuation: true,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 4000,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 4000,
        },
      });
    } catch {
      cleanup();
      setAvailable(false);
      return false;
    }
    setListening(true);
    return true;
  }, [cleanup]);

  const stop = useCallback(() => {
    try { mod?.stop(); } catch { setListening(false); }
  }, []);

  return { available, listening, heard, start, stop };
}
