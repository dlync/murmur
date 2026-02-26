import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, Alert, Dimensions, Image, Animated,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { EMOTIONS, EmotionEntry } from '../hooks/useEmotions';
import { HABITS, HabitEntry } from '../hooks/useHabits';
import { Thought, UserStats } from '../hooks/useThoughts';
import { formatDate } from '../constants/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = Math.floor((SCREEN_WIDTH - 56 - 24) / 7);

interface Props {
  thoughts: Thought[];
  user: UserStats;
  emotionHistory: EmotionEntry[];
  habitHistory: HabitEntry[];
  onDelete: (id: string) => void;
  getPhotoForDate: (date: string) => string | null;
}

function dateStr(d: Date) { return d.toISOString().split('T')[0]; }
function friendlyDate(str: string) {
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ArchiveScreen({ thoughts, user, emotionHistory, habitHistory, onDelete, getPhotoForDate }: Props) {
  const { colors } = useContext(ThemeContext);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const today = new Date();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const last7Emotions = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 6);
    const cutoffStr = dateStr(cutoff);
    const relevant = (emotionHistory ?? []).filter(e => e.date >= cutoffStr);
    const counts: Record<string, number> = {};
    relevant.forEach(entry => entry.emotions.forEach(id => { counts[id] = (counts[id] ?? 0) + 1; }));
    return EMOTIONS.map(e => ({ ...e, count: counts[e.id] ?? 0 }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [emotionHistory]);

  const maxEmotionCount = Math.max(...last7Emotions.map(e => e.count), 1);

  const calendarDays = useMemo(() => {
    const days: (string | null)[] = [];
    const start = new Date(today);
    start.setDate(today.getDate() - 27);
    const dow = start.getDay() === 0 ? 6 : start.getDay() - 1;
    start.setDate(start.getDate() - dow);
    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const s = dateStr(d);
      days.push(s <= dateStr(today) ? s : null);
    }
    return days;
  }, []);

  const emotionByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    (emotionHistory ?? []).forEach(e => { map[e.date] = e.emotions; });
    return map;
  }, [emotionHistory]);

  const habitByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    (habitHistory ?? []).forEach(e => { map[e.date] = e.habits; });
    return map;
  }, [habitHistory]);

  const thoughtsByDate = useMemo(() => {
    const map: Record<string, Thought[]> = {};
    thoughts.forEach(t => {
      const d = t.timestamp.split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [thoughts]);

  function dayHasActivity(d: string) {
    return (thoughtsByDate[d]?.length ?? 0) > 0
      || (emotionByDate[d]?.length ?? 0) > 0
      || (habitByDate[d]?.length ?? 0) > 0
      || !!getPhotoForDate(d);
  }

  function dayEmotionSample(d: string): string | null {
    const ids = emotionByDate[d];
    if (!ids?.length) return null;
    return EMOTIONS.find(e => e.id === ids[0])?.emoji ?? null;
  }

  const selectedThoughts = selectedDay ? (thoughtsByDate[selectedDay] ?? []) : [];
  const selectedEmotions = selectedDay ? (emotionByDate[selectedDay] ?? []) : [];
  const selectedEmotionDetails = selectedEmotions
    .map(id => EMOTIONS.find(e => e.id === id)).filter(Boolean) as typeof EMOTIONS;
  const selectedHabits = selectedDay ? (habitByDate[selectedDay] ?? []) : [];
  const selectedHabitDetails = selectedHabits
    .map(id => HABITS.find(h => h.id === id)).filter(Boolean) as typeof HABITS;
  const selectedPhoto = selectedDay ? getPhotoForDate(selectedDay) : null;

  function confirmDelete(id: string) {
    Alert.alert('Delete entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  }

  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>

        <Text style={[styles.pageTitle, { color: colors.bright }]}>
          <Text style={[styles.pageTitleEm, { color: colors.accent }]}>{user.username}</Text>
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.border2 }]}>your story, in numbers</Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Emotion bar chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.bright }]}>
            Most felt <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>this week</Text>
          </Text>
          {last7Emotions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.border2 }]}>No emotions logged this week yet.</Text>
          ) : (
            <View style={styles.barChart}>
              {last7Emotions.map(e => (
                <View key={e.id} style={styles.barRow}>
                  <Text style={styles.barEmoji}>{e.emoji}</Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.surface2 }]}>
                    <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${(e.count / maxEmotionCount) * 100}%` }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.muted }]}>{e.label}</Text>
                  <Text style={[styles.barCount, { color: colors.border2 }]}>{e.count}×</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Calendar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.bright }]}>
            Your <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>days</Text>
          </Text>
          <Text style={[styles.calendarHint, { color: colors.border2 }]}>Tap a day to see its log</Text>

          <View style={styles.dowRow}>
            {DOW.map((d, i) => (
              <Text key={i} style={[styles.dowLabel, { color: colors.border2 }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {calendarDays.map((d, i) => {
              if (!d) return <View key={i} style={styles.calCell} />;
              const isToday = d === dateStr(today);
              const hasData = dayHasActivity(d);
              const emoji = dayEmotionSample(d);
              const hasPhoto = !!getPhotoForDate(d);
              const thoughtCount = thoughtsByDate[d]?.length ?? 0;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.calCell,
                    { borderColor: colors.border, backgroundColor: colors.bg },
                    hasData && { backgroundColor: colors.surface, borderColor: colors.border2 },
                    isToday && { borderColor: colors.accent },
                  ]}
                  onPress={() => setSelectedDay(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calDayNum, { color: colors.muted },
                    isToday && { color: colors.accent, fontWeight: '700' },
                  ]}>
                    {parseInt(d.split('-')[2])}
                  </Text>
                  {emoji ? (
                    <Text style={styles.calEmoji}>{emoji}</Text>
                  ) : hasPhoto ? (
                    <Text style={styles.calEmoji}>📷</Text>
                  ) : thoughtCount > 0 ? (
                    <View style={[styles.calDot, { backgroundColor: colors.accent }]} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Day modal */}
        <Modal
          visible={!!selectedDay}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedDay(null)}
        >
          <ScrollView
            style={[styles.modal, { backgroundColor: colors.bg }]}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalDate, { color: colors.bright }]}>
                {selectedDay ? friendlyDate(selectedDay) : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Text style={[styles.modalClose, { color: colors.muted }]}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Photo */}
            {selectedPhoto && (
              <>
                <View style={styles.modalSection}>
                  <Image source={{ uri: selectedPhoto }} style={styles.modalPhoto} resizeMode="cover" />
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </>
            )}

            {/* Emotions */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                Feelings <Text style={[styles.modalSectionEm, { color: colors.accent }]}>that day</Text>
              </Text>
              {selectedEmotionDetails.length === 0 ? (
                <Text style={[styles.modalEmpty, { color: colors.border2 }]}>No emotions logged.</Text>
              ) : (
                <View style={styles.chipRow}>
                  {selectedEmotionDetails.map(e => (
                    <View key={e.id} style={[styles.chip, { borderColor: colors.accent, backgroundColor: colors.accentL }]}>
                      <Text style={styles.chipEmoji}>{e.emoji}</Text>
                      <Text style={[styles.chipLabel, { color: colors.accentD }]}>{e.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Habits */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                Habits <Text style={[styles.modalSectionEm, { color: colors.accent }]}>that day</Text>
              </Text>
              {selectedHabitDetails.length === 0 ? (
                <Text style={[styles.modalEmpty, { color: colors.border2 }]}>No habits logged.</Text>
              ) : (
                <View style={styles.habitRow}>
                  {selectedHabitDetails.map(h => (
                    <View key={h.id} style={[styles.habitChip, { borderColor: colors.accent, backgroundColor: colors.accentL }]}>
                      <Text style={styles.chipEmoji}>{h.emoji}</Text>
                      <Text style={[styles.chipLabel, { color: colors.accentD }]}>{h.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Thoughts */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                {selectedThoughts.length}{' '}
                <Text style={[styles.modalSectionEm, { color: colors.accent }]}>
                  {selectedThoughts.length === 1 ? 'thought' : 'thoughts'}
                </Text>
              </Text>
              {selectedThoughts.length === 0 ? (
                <Text style={[styles.modalEmpty, { color: colors.border2 }]}>No entries written.</Text>
              ) : (
                selectedThoughts.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.thoughtEntry, { borderTopColor: colors.border }]}
                    onLongPress={() => confirmDelete(t.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.thoughtMeta}>
                      <Text style={[styles.thoughtTime, { color: colors.border2 }]}>
                        {new Date(t.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {t.tag ? <Text style={[styles.thoughtTag, { color: colors.accent }]}>{t.tag}</Text> : null}
                    </View>
                    <Text style={[styles.thoughtBody, { color: colors.text }]}>{t.body}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {selectedThoughts.length > 0 && (
              <Text style={[styles.deleteHint, { color: colors.border }]}>Long-press a thought to delete</Text>
            )}
          </ScrollView>
        </Modal>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 60 },

  pageTitle: { fontFamily: 'Georgia', fontSize: 32, fontWeight: '300', letterSpacing: -0.5, marginBottom: 4 },
  pageTitleEm: { fontStyle: 'italic' },
  pageSubtitle: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, marginBottom: 20 },

  divider: { height: 1, marginVertical: 24 },

  section: { marginBottom: 0 },
  sectionTitle: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '300', letterSpacing: -0.3, marginBottom: 18 },
  sectionTitleEm: { fontStyle: 'italic' },
  emptyText: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13 },

  barChart: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barEmoji: { fontSize: 15, width: 22 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barLabel: { fontFamily: 'System', fontSize: 10, fontWeight: '500', width: 68 },
  barCount: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 12, width: 20, textAlign: 'right' },

  calendarHint: { fontFamily: 'System', fontSize: 9, fontStyle: 'italic', marginTop: -10, marginBottom: 16 },
  dowRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  dowLabel: { width: DAY_SIZE, textAlign: 'center', fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calCell: { width: DAY_SIZE, height: DAY_SIZE, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  calDayNum: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },
  calEmoji: { fontSize: 10, marginTop: 1 },
  calDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },

  modal: { flex: 1 },
  modalContent: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalDate: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 22, fontWeight: '300', flex: 1, letterSpacing: -0.3, lineHeight: 28 },
  modalClose: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', paddingTop: 4 },
  modalPhoto: { width: '100%', height: 220, marginBottom: 4 },
  modalSection: { marginBottom: 0 },
  modalSectionTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '300', marginBottom: 16 },
  modalSectionEm: { fontStyle: 'italic' },
  modalEmpty: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 11, borderWidth: 1 },
  chipEmoji: { fontSize: 13 },
  chipLabel: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },

  habitRow: { flexDirection: 'column', gap: 8 },
  habitChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1 },

  thoughtEntry: { paddingVertical: 16, borderTopWidth: 1 },
  thoughtMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  thoughtTime: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase' },
  thoughtTag: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  thoughtBody: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, lineHeight: 25 },

  deleteHint: { fontFamily: 'System', fontSize: 9, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
});