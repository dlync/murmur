import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceNote {
  id: string;
  date: string;        // YYYY-MM-DD
  uri: string;         // local file URI
  durationMs: number;
  createdAt: string;
}

const STORAGE_KEY = 'murmur_voice_notes';

async function readAll(): Promise<VoiceNote[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeAll(notes: VoiceNote[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function useVoiceNotes() {
  const [notes, setNotes] = useState<VoiceNote[]>([]);

  useEffect(() => { readAll().then(setNotes); }, []);

  async function addNote(date: string, uri: string, durationMs: number) {
    const note: VoiceNote = {
      id: Date.now().toString(),
      date,
      uri,
      durationMs,
      createdAt: new Date().toISOString(),
    };
    const updated = [...notes, note];
    setNotes(updated);
    await writeAll(updated);
    return note;
  }

  async function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await writeAll(updated);
  }

  function getNotesForDate(date: string): VoiceNote[] {
    return notes.filter(n => n.date === date);
  }

  function hasNoteOnDate(date: string): boolean {
    return notes.some(n => n.date === date);
  }

  return { notes, addNote, deleteNote, getNotesForDate, hasNoteOnDate };
}