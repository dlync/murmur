import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const EMOTIONS = [
  { id: 'calm',       label: 'Calm',       emoji: '🌿' },
  { id: 'grateful',   label: 'Grateful',   emoji: '✨' },
  { id: 'anxious',    label: 'Anxious',    emoji: '🌊' },
  { id: 'hopeful',    label: 'Hopeful',    emoji: '🌤' },
  { id: 'tired',      label: 'Tired',      emoji: '🌙' },
  { id: 'content',    label: 'Content',    emoji: '☁️' },
  { id: 'frustrated', label: 'Frustrated', emoji: '🔥' },
  { id: 'sad',        label: 'Sad',        emoji: '🌧' },
  { id: 'energised',  label: 'Energised',  emoji: '⚡️' },
  { id: 'unsettled',  label: 'Unsettled',  emoji: '🍂' },
];

export interface EmotionEntry {
  date: string;
  emotions: string[];
  savedAt: string;
}

const STORAGE_KEY = 'murmur_emotions';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

async function readAll(): Promise<EmotionEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useEmotions() {
  const [todayEmotions, setTodayEmotions] = useState<string[]>([]); // always an array
  const [history, setHistory] = useState<EmotionEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await readAll();
      setHistory(all);
      const todayEntry = all.find(e => e.date === todayStr());
      if (todayEntry?.emotions?.length) {
        setTodayEmotions(todayEntry.emotions);
        setSaved(true);
      }
    })();
  }, []);

  function toggleEmotion(id: string) {
    setTodayEmotions(prev => {
      const safe = prev ?? [];
      return safe.includes(id) ? safe.filter(e => e !== id) : [...safe, id];
    });
    setSaved(false);
  }

  async function confirmSave(emotions: string[]) {
    try {
      const all = await readAll();
      const entry: EmotionEntry = {
        date: todayStr(),
        emotions: emotions ?? [],
        savedAt: new Date().toISOString(),
      };
      const updated = [...all.filter(e => e.date !== todayStr()), entry];
      updated.sort((a, b) => b.date.localeCompare(a.date));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistory(updated);
      setSaved(true);
    } catch (e) {
      console.error('Failed to save emotions', e);
    }
  }

  return {
    todayEmotions: todayEmotions ?? [],
    toggleEmotion,
    confirmSave,
    history: history ?? [],
    saved,
  };
}