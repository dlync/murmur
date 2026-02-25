import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Thought {
  id: string;
  body: string;
  tag: string;
  timestamp: string;
}

export interface UserStats {
  username: string;
  streak: number;
  thoughtsToday: number;
  thoughtsTotal: number;
  lastLoggedDate: string | null; // 👈 add this to track streak
}

const THOUGHTS_KEY = '@murmur_thoughts';
const USER_KEY = '@murmur_user';

const DEFAULT_USER: UserStats = {
  username: 'wanderer',
  streak: 0,
  thoughtsToday: 0,
  thoughtsTotal: 0,
  lastLoggedDate: null,
};

function calculateStreak(currentStreak: number, lastLoggedDate: string | null): number {
  const today = new Date().toDateString();

  if (!lastLoggedDate) return 1; // First ever thought

  const last = new Date(lastLoggedDate).toDateString();

  if (last === today) {
    // Already logged today, streak unchanged
    return currentStreak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (last === yesterdayStr) {
    // Logged yesterday, keep the chain going
    return currentStreak + 1;
  }

  // Missed a day — reset
  return 1;
}

export function useThoughts() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [user, setUser] = useState<UserStats>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [t, u] = await Promise.all([
        AsyncStorage.getItem(THOUGHTS_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      const loadedThoughts: Thought[] = t ? JSON.parse(t) : [];
      const loadedUser: UserStats = u ? JSON.parse(u) : DEFAULT_USER;

      const today = new Date().toDateString();
      const todayCount = loadedThoughts.filter(
        (th) => new Date(th.timestamp).toDateString() === today
      ).length;

      // If the user hasn't logged today or yesterday, their streak is broken
      const restoredStreak = restoreStreak(loadedUser);

      setThoughts(loadedThoughts);
      setUser({
        ...loadedUser,
        thoughtsToday: todayCount,
        thoughtsTotal: loadedThoughts.length,
        streak: restoredStreak,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Called on load — checks if the streak should have broken while app was closed
  function restoreStreak(loadedUser: UserStats): number {
    const { streak, lastLoggedDate } = loadedUser;
    if (!lastLoggedDate) return 0;

    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const last = new Date(lastLoggedDate).toDateString();

    // Streak is still alive if they logged today or yesterday
    if (last === today || last === yesterdayStr) return streak;

    // Otherwise it's broken
    return 0;
  }

  async function addThought(body: string, tag: string) {
    const newThought: Thought = {
      id: Date.now().toString(),
      body,
      tag,
      timestamp: new Date().toISOString(),
    };

    const updated = [newThought, ...thoughts];
    setThoughts(updated);

    const today = new Date().toDateString();
    const todayCount = updated.filter(
      (th) => new Date(th.timestamp).toDateString() === today
    ).length;

    const newStreak = calculateStreak(user.streak, user.lastLoggedDate);

    const newUser: UserStats = {
      ...user,
      thoughtsToday: todayCount,
      thoughtsTotal: updated.length,
      streak: newStreak,
      lastLoggedDate: new Date().toISOString(), // 👈 always update on new thought
    };

    setUser(newUser);
    await AsyncStorage.setItem(THOUGHTS_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }

  async function deleteThought(id: string) {
    const updated = thoughts.filter((t) => t.id !== id);
    setThoughts(updated);

    const today = new Date().toDateString();
    const todayCount = updated.filter(
      (th) => new Date(th.timestamp).toDateString() === today
    ).length;

    const newUser: UserStats = {
      ...user,
      thoughtsToday: todayCount,
      thoughtsTotal: updated.length,
      // Note: intentionally not touching streak/lastLoggedDate on delete
    };

    setUser(newUser);
    await AsyncStorage.setItem(THOUGHTS_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }

  async function updateUsername(name: string) {
    const newUser = { ...user, username: name };
    setUser(newUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }

  return { thoughts, user, loading, addThought, deleteThought, updateUsername };
}