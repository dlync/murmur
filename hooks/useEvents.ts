import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CalendarEvent {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  note?: string;
  createdAt: string;
}

const STORAGE_KEY = 'murmur_events';

async function readAll(): Promise<CalendarEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeAll(events: CalendarEvent[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    readAll().then(setEvents);
  }, []);

  async function addEvent(date: string, title: string, note?: string) {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date,
      title: title.trim(),
      note: note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = [...events, newEvent].sort((a, b) => a.date.localeCompare(b.date));
    setEvents(updated);
    await writeAll(updated);
    return newEvent;
  }

  async function deleteEvent(id: string) {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    await writeAll(updated);
  }

  async function updateEvent(id: string, title: string, note?: string) {
    const updated = events.map(e =>
      e.id === id ? { ...e, title: title.trim(), note: note?.trim() || undefined } : e
    );
    setEvents(updated);
    await writeAll(updated);
  }

  function getEventsForDate(date: string): CalendarEvent[] {
    return events.filter(e => e.date === date);
  }

  function hasEventOnDate(date: string): boolean {
    return events.some(e => e.date === date);
  }

  return {
    events,
    addEvent,
    deleteEvent,
    updateEvent,
    getEventsForDate,
    hasEventOnDate,
  };
}