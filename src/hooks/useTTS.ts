import { useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useReaderStore } from '@/store';

export function useTTS() {
  const { settings, ttsActive, ttsParagraphIndex, setTtsActive, setTtsParagraphIndex } = useReaderStore();
  const paragraphsRef = useRef<string[]>([]);
  const activeRef = useRef(false);

  useEffect(() => {
    activeRef.current = ttsActive;
  }, [ttsActive]);

  const setParagraphs = useCallback((paragraphs: string[]) => {
    paragraphsRef.current = paragraphs;
  }, []);

  const speakParagraph = useCallback(async (index: number) => {
    if (!activeRef.current) return;
    const paragraphs = paragraphsRef.current;
    if (index >= paragraphs.length) {
      setTtsActive(false);
      return;
    }

    const text = paragraphs[index]?.trim();
    if (!text) {
      setTtsParagraphIndex(index + 1);
      speakParagraph(index + 1);
      return;
    }

    setTtsParagraphIndex(index);

    await Speech.speak(text, {
      rate: settings.ttsSpeed,
      pitch: settings.ttsPitch,
      voice: settings.ttsVoice,
      onDone: () => {
        if (activeRef.current) {
          speakParagraph(index + 1);
        }
      },
      onError: () => {
        if (activeRef.current) {
          speakParagraph(index + 1);
        }
      },
    });
  }, [settings.ttsSpeed, settings.ttsPitch, settings.ttsVoice]);

  const startTTS = useCallback(async (startIndex = 0) => {
    await Speech.stop();
    setTtsActive(true);
    activeRef.current = true;
    speakParagraph(startIndex);
  }, [speakParagraph]);

  const stopTTS = useCallback(async () => {
    activeRef.current = false;
    setTtsActive(false);
    await Speech.stop();
  }, []);

  const pauseTTS = useCallback(async () => {
    activeRef.current = false;
    setTtsActive(false);
    await Speech.stop();
  }, []);

  const skipForward = useCallback(() => {
    const next = ttsParagraphIndex + 1;
    Speech.stop();
    speakParagraph(next);
  }, [ttsParagraphIndex, speakParagraph]);

  const skipBack = useCallback(() => {
    const prev = Math.max(0, ttsParagraphIndex - 1);
    Speech.stop();
    speakParagraph(prev);
  }, [ttsParagraphIndex, speakParagraph]);

  // Get available voices
  const getVoices = useCallback(async () => {
    return Speech.getAvailableVoicesAsync();
  }, []);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return {
    isActive: ttsActive,
    currentIndex: ttsParagraphIndex,
    setParagraphs,
    startTTS,
    stopTTS,
    pauseTTS,
    skipForward,
    skipBack,
    getVoices,
  };
}
