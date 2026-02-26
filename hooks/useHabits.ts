import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HABITS = [
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
  { id: 'reading',  label: 'Reading',  emoji: '📖' },
  { id: 'diet',     label: 'Diet',     emoji: '🥗' },
  { id: 'sleep',    label: 'Slept well', emoji: '😴' },
];

export interface HabitEntry {
  date: string;
  habits: string[];
  savedAt: string;
}

const STORAGE_KEY = 'murmur_habits';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

async function readAll(): Promise<HabitEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useHabits() {
  const [todayHabits, setTodayHabits] = useState<string[]>([]);
  const [history, setHistory] = useState<HabitEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await readAll();
      setHistory(all);
      const todayEntry = all.find(e => e.date === todayStr());
      if (todayEntry?.habits?.length) {
        setTodayHabits(todayEntry.habits);
        setSaved(true);
      }
    })();
  }, []);

  function toggleHabit(id: string) {
    setTodayHabits(prev => {
      const safe = prev ?? [];
      return safe.includes(id) ? safe.filter(h => h !== id) : [...safe, id];
    });
    setSaved(false);
  }

  async function confirmSave(habits: string[]) {
    try {
      const all = await readAll();
      const entry: HabitEntry = {
        date: todayStr(),
        habits: habits ?? [],
        savedAt: new Date().toISOString(),
      };
      const updated = [...all.filter(e => e.date !== todayStr()), entry];
      updated.sort((a, b) => b.date.localeCompare(a.date));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistory(updated);
      setSaved(true);
    } catch (e) {
      console.error('Failed to save habits', e);
    }
  }

  return {
    todayHabits: todayHabits ?? [],
    toggleHabit,
    confirmSave,
    history: history ?? [],
    saved,
  };
}