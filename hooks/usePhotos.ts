import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'murmur_photos';

export interface PhotoEntry {
  date: string;   // YYYY-MM-DD
  uri: string;    // local file URI from image picker
  savedAt: string;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

async function readAll(): Promise<PhotoEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function usePhotos() {
  const [photoHistory, setPhotoHistory] = useState<PhotoEntry[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const all = await readAll();
      setPhotoHistory(all);
      const entry = all.find(p => p.date === todayStr());
      if (entry) setTodayPhoto(entry.uri);
    })();
  }, []);

  async function savePhoto(uri: string) {
    const all = await readAll();
    const entry: PhotoEntry = {
      date: todayStr(),
      uri,
      savedAt: new Date().toISOString(),
    };
    const updated = [...all.filter(p => p.date !== todayStr()), entry];
    updated.sort((a, b) => b.date.localeCompare(a.date));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPhotoHistory(updated);
    setTodayPhoto(uri);
  }

  async function removePhoto(date: string) {
    const all = await readAll();
    const updated = all.filter(p => p.date !== date);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPhotoHistory(updated);
    if (date === todayStr()) setTodayPhoto(null);
  }

  function getPhotoForDate(date: string): string | null {
    return photoHistory.find(p => p.date === date)?.uri ?? null;
  }

  return { todayPhoto, photoHistory, savePhoto, removePhoto, getPhotoForDate };
}