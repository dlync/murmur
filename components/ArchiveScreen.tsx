import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, Alert, Dimensions, Image, Animated, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { EMOTIONS, EmotionEntry } from '../hooks/useEmotions';
import { HABITS, HabitEntry } from '../hooks/useHabits';
import { CalendarEvent } from '../hooks/useEvents';
import { VoiceNote } from '../hooks/useVoiceNotes';
import { VoiceNotePlayback } from './VoiceNoteRecorder';
import { FormattedText } from './FormattedText';
import { Thought, UserStats } from '../hooks/useThoughts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = Math.floor((SCREEN_WIDTH - 56 - 20) / 7);

interface Props {
  thoughts: Thought[];
  user: UserStats;
  emotionHistory: EmotionEntry[];
  habitHistory: HabitEntry[];
  onDelete: (id: string) => void;
  getPhotoForDate: (date: string) => string | null;
  events: CalendarEvent[];
  onAddEvent: (date: string, title: string, note?: string) => Promise<CalendarEvent>;
  onDeleteEvent: (id: string) => Promise<void>;
  onUpdateEvent: (id: string, title: string, note?: string) => Promise<void>;
  getVoiceNotesForDate: (date: string) => VoiceNote[];
  voiceNotes: VoiceNote[];
  onDeleteVoiceNote: (id: string) => Promise<void>;
}

function dateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function friendlyDate(str: string) {
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
function isFuture(str: string) { return str > dateStr(new Date()); }
function isTodayOrFuture(str: string) { return str >= dateStr(new Date()); }
function plural(n: number, singular: string, pluralStr: string) {
  return n === 1 ? singular : pluralStr;
}

function buildMonthGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const grid: (string | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    grid.push(dateStr(date));
  }
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DOW = ['M','T','W','T','F','S','S'];

export default function ArchiveScreen({
  events = [], thoughts, user, emotionHistory, habitHistory, onDelete,
  getPhotoForDate, onAddEvent, onDeleteEvent, onUpdateEvent,
  getVoiceNotesForDate, voiceNotes = [], onDeleteVoiceNote,
}: Props) {
  const { colors } = useContext(ThemeContext);

  function hasEventOnDate(date: string) { return (events ?? []).some(e => e.date === date); }
  function getEventsForDate(date: string) { return (events ?? []).filter(e => e.date === date); }

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventNote, setEventNote] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }
  function goToday() { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }

  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth();
  const calGrid = useMemo(() => buildMonthGrid(calYear, calMonth), [calYear, calMonth]);

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

  const weekStats = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 6);
    const cutoffStr = dateStr(cutoff);
    const last7Dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Dates.push(dateStr(d));
    }
    const photos = last7Dates.filter(d => !!getPhotoForDate(d)).length;
    const notes = (voiceNotes ?? []).filter(n => n.date >= cutoffStr).length;
    const habitCounts: Record<string, number> = {};
    (habitHistory ?? []).filter(e => e.date >= cutoffStr).forEach(e => {
      e.habits.forEach(id => { habitCounts[id] = (habitCounts[id] ?? 0) + 1; });
    });
    return { photos, notes, habitCounts };
  }, [voiceNotes, habitHistory, getPhotoForDate]);

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

  function stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/div>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  const longestThought = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 6);
    const cutoffStr = dateStr(cutoff);
    const weekThoughts = thoughts.filter(t => t.timestamp.split('T')[0] >= cutoffStr);
    if (!weekThoughts.length) return null;
    return weekThoughts.reduce((best, t) =>
      stripHtml(t.body).length > stripHtml(best.body).length ? t : best
    );
  }, [thoughts]);

  const longestWordCount = longestThought
    ? stripHtml(longestThought.body).split(/\s+/).filter(Boolean).length
    : 0;

  function dayHasActivity(d: string) {
    return (thoughtsByDate[d]?.length ?? 0) > 0
      || (emotionByDate[d]?.length ?? 0) > 0
      || (habitByDate[d]?.length ?? 0) > 0
      || !!getPhotoForDate(d);
  }

  function handleDayPress(d: string) {
    setSelectedDay(d);
    setShowEventForm(false);
    setEventTitle('');
    setEventNote('');
    setEditingEvent(null);
  }

  function handleCloseDay() {
    setSelectedDay(null);
    setShowEventForm(false);
    setEventTitle('');
    setEventNote('');
    setEditingEvent(null);
  }

  async function handleSaveEvent() {
    if (!eventTitle.trim() || !selectedDay) return;
    if (editingEvent) {
      await onUpdateEvent(editingEvent.id, eventTitle, eventNote);
    } else {
      await onAddEvent(selectedDay, eventTitle, eventNote);
    }
    setEventTitle('');
    setEventNote('');
    setShowEventForm(false);
    setEditingEvent(null);
  }

  function handleEditEvent(event: CalendarEvent) {
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventNote(event.note ?? '');
    setShowEventForm(true);
  }

  function handleDeleteEvent(id: string) {
    Alert.alert('Delete event', 'Remove this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteEvent(id) },
    ]);
  }

  function handleCancelEventForm() {
    setShowEventForm(false);
    setEventTitle('');
    setEventNote('');
    setEditingEvent(null);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  }

  const selectedIsFuture = selectedDay ? isTodayOrFuture(selectedDay) : false;
  const selectedThoughts = selectedDay ? (thoughtsByDate[selectedDay] ?? []) : [];
  const selectedEmotions = selectedDay ? (emotionByDate[selectedDay] ?? []) : [];
  const selectedEmotionDetails = selectedEmotions
    .map(id => EMOTIONS.find(e => e.id === id)).filter(Boolean) as typeof EMOTIONS;
  const selectedHabits = selectedDay ? (habitByDate[selectedDay] ?? []) : [];
  const selectedHabitDetails = selectedHabits
    .map(id => HABITS.find(h => h.id === id)).filter(Boolean) as typeof HABITS;
  const selectedPhoto = selectedDay ? getPhotoForDate(selectedDay) : null;
  const selectedEvents = selectedDay ? getEventsForDate(selectedDay) : [];
  const selectedVoiceNotes = selectedDay ? getVoiceNotesForDate(selectedDay) : [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          <Text style={[styles.pageTitle, { color: colors.bright }]}>
            <Text style={[styles.pageTitleEm, { color: colors.accent }]}>{user.username}</Text>
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.bright }]}>your week, in numbers</Text>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Weekly stats strip */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              This <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>week</Text>
            </Text>
            <View style={styles.weekStatsGrid}>

              <View style={[styles.weekStatCell, { borderColor: colors.bright }]}>
                <Text style={styles.weekStatEmoji}>📷</Text>
                <Text style={[styles.weekStatNum, { color: colors.accent }]}>{weekStats.photos}</Text>
                <Text style={[styles.weekStatLabel, { color: colors.bright }]}>
                  {plural(weekStats.photos, 'photo', 'photos')}
                </Text>
              </View>

              <View style={[styles.weekStatCell, { borderColor: colors.bright }]}>
                <Text style={styles.weekStatEmoji}>🎙</Text>
                <Text style={[styles.weekStatNum, { color: colors.accent }]}>{weekStats.notes}</Text>
                <Text style={[styles.weekStatLabel, { color: colors.bright }]}>
                  {plural(weekStats.notes, 'voice note', 'voice notes')}
                </Text>
              </View>

              <View style={[styles.weekStatCell, { borderColor: colors.bright }]}>
                <Text style={styles.weekStatEmoji}>🏃</Text>
                <Text style={[styles.weekStatNum, { color: colors.accent }]}>{weekStats.habitCounts['exercise'] ?? 0}</Text>
                <Text style={[styles.weekStatLabel, { color: colors.bright }]}>
                  {plural(weekStats.habitCounts['exercise'] ?? 0, 'workout', 'workouts')}
                </Text>
              </View>

              <View style={[styles.weekStatCell, { borderColor: colors.bright }]}>
                <Text style={styles.weekStatEmoji}>📖</Text>
                <Text style={[styles.weekStatNum, { color: colors.accent }]}>{weekStats.habitCounts['reading'] ?? 0}</Text>
                <Text style={[styles.weekStatLabel, { color: colors.bright }]}>
                  {plural(weekStats.habitCounts['reading'] ?? 0, 'reading day', 'reading days')}
                </Text>
              </View>

              <View style={[styles.weekStatCell, { borderColor: colors.bright }]}>
                <Text style={styles.weekStatEmoji}>🥗</Text>
                <Text style={[styles.weekStatNum, { color: colors.accent }]}>{weekStats.habitCounts['diet'] ?? 0}</Text>
                <Text style={[styles.weekStatLabel, { color: colors.bright }]}>
                  {plural(weekStats.habitCounts['diet'] ?? 0, 'good eat', 'good eats')}
                </Text>
              </View>

              <View style={[styles.weekStatCell, { borderColor: colors.bright }]}>
                <Text style={styles.weekStatEmoji}>😴</Text>
                <Text style={[styles.weekStatNum, { color: colors.accent }]}>{weekStats.habitCounts['sleep'] ?? 0}</Text>
                <Text style={[styles.weekStatLabel, { color: colors.bright }]}>
                  {plural(weekStats.habitCounts['sleep'] ?? 0, 'good sleep', 'good sleeps')}
                </Text>
              </View>

            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Longest entry */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              Longest <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>this week</Text>
            </Text>
            {longestThought ? (
              <View style={[styles.longestCard, { borderColor: colors.bright }]}>
                <View style={styles.longestMeta}>
                  <Text style={[styles.longestNum, { color: colors.accent }]}>{longestWordCount}</Text>
                  <Text style={[styles.longestUnits, { color: colors.bright }]}> words</Text>
                  <Text style={[styles.longestDate, { color: colors.bright }]}>
                    {'  '}
                    {new Date(longestThought.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <FormattedText
                  text={longestThought.body}
                  style={[styles.longestExcerpt, { color: colors.bright }]}
                  numberOfLines={3}
                />
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.bright }]}>No entries written this week yet.</Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Emotion bar chart */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              Most felt <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>this week</Text>
            </Text>
            {last7Emotions.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.bright }]}>No emotions logged this week yet.</Text>
            ) : (
              <View style={styles.barChart}>
                {last7Emotions.map(e => (
                  <View key={e.id} style={styles.barRow}>
                    <Text style={styles.barEmoji}>{e.emoji}</Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.surface2 }]}>
                      <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${(e.count / maxEmotionCount) * 100}%` }]} />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.bright }]}>{e.label}</Text>
                    <Text style={[styles.barCount, { color: colors.bright }]}>{e.count}×</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Calendar */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              Your <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>calendar</Text>
            </Text>

            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                <Text style={[styles.monthNavArrow, { color: colors.bright }]}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goToday} activeOpacity={0.7} style={styles.monthTitleWrap}>
                <Text style={[styles.monthTitle, { color: colors.bright }]}>
                  {MONTH_NAMES[calMonth]}{' '}
                  <Text style={[styles.monthTitleYear, { color: colors.accent }]}>{calYear}</Text>
                </Text>
                {!isCurrentMonth && (
                  <Text style={[styles.todayHint, { color: colors.accent }]}>Tap to return to today</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                <Text style={[styles.monthNavArrow, { color: colors.bright }]}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dowRow}>
              {DOW.map((d, i) => (
                <Text key={i} style={[styles.dowLabel, { color: colors.bright }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calGrid.map((d, i) => {
                if (!d) return <View key={i} style={styles.calCellEmpty} />;
                const isToday = d === dateStr(today);
                const future = isFuture(d);
                const hasData = !future && dayHasActivity(d);
                const hasEvents = hasEventOnDate(d);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.calCell,
                      { borderColor: colors.bright, backgroundColor: colors.bg },
                      isToday && { borderColor: colors.accent },
                    ]}
                    onPress={() => handleDayPress(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calDayNum,
                      { color: colors.bright },
                      future && { opacity: 0.35 },
                      isToday && { color: colors.accent, opacity: 1, fontWeight: '700' },
                    ]}>
                      {parseInt(d.split('-')[2])}
                    </Text>
                    <View style={styles.calDotRow}>
                      <View style={[styles.calDot, { backgroundColor: hasData ? colors.bright : 'transparent' }]} />
                      <View style={[styles.calDot, { backgroundColor: hasEvents ? colors.accent : 'transparent' }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.bright }]} />
                <Text style={[styles.legendText, { color: colors.bright }]}>Has log</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.legendText, { color: colors.bright }]}>Event</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendCell, { borderColor: colors.accent }]}>
                  <Text style={[styles.legendCellNum, { color: colors.accent }]}>1</Text>
                </View>
                <Text style={[styles.legendText, { color: colors.bright }]}>Today</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.legendText, { color: colors.bright, opacity: 0.5 }]}>dots: left = log · right = event</Text>
              </View>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Day modal */}
      <Modal
        visible={!!selectedDay}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseDay}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={[styles.modal, { backgroundColor: colors.bg }]}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={[styles.modalDate, { color: colors.bright }]}>
                  {selectedDay ? friendlyDate(selectedDay) : ''}
                </Text>
                {selectedDay && isFuture(selectedDay) && (
                  <Text style={[styles.modalFuturePill, { color: colors.accent, borderColor: colors.accent }]}>
                    Upcoming
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={handleCloseDay}>
                <Text style={[styles.modalClose, { color: colors.bright }]}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.bright }]} />

            {/* FUTURE / TODAY — events panel */}
            {selectedIsFuture && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                  Events <Text style={[styles.modalSectionEm, { color: colors.accent }]}>planned</Text>
                </Text>

                {selectedEvents.length > 0 && (
                  <View style={styles.eventList}>
                    {selectedEvents.map(ev => (
                      <View key={ev.id} style={[styles.eventCard, { backgroundColor: colors.surface }]}>
                        <View style={[styles.eventCardAccent, { backgroundColor: colors.accent }]} />
                        <View style={styles.eventCardBody}>
                          <Text style={[styles.eventCardTitle, { color: colors.bright }]}>{ev.title}</Text>
                          {ev.note ? <Text style={[styles.eventCardNote, { color: colors.bright }]}>{ev.note}</Text> : null}
                        </View>
                        <View style={styles.eventCardActions}>
                          <TouchableOpacity onPress={() => handleEditEvent(ev)} activeOpacity={0.7}>
                            <Text style={[styles.eventActionText, { color: colors.accent }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteEvent(ev.id)} activeOpacity={0.7}>
                            <Text style={[styles.eventActionText, { color: colors.error }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {showEventForm ? (
                  <View style={[styles.eventForm, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.eventFormLabel, { color: colors.bright }]}>
                      {editingEvent ? 'Edit event' : 'New event'}
                    </Text>
                    <TextInput
                      style={[styles.eventFormInput, { color: colors.text, borderBottomColor: colors.bright }]}
                      placeholder="e.g. Doctor's appointment"
                      placeholderTextColor={colors.bright}
                      value={eventTitle}
                      onChangeText={setEventTitle}
                      autoFocus
                      returnKeyType="next"
                    />
                    <TextInput
                      style={[styles.eventFormNote, { color: colors.text, borderBottomColor: colors.bright }]}
                      placeholder="Add a note (optional)"
                      placeholderTextColor={colors.bright}
                      value={eventNote}
                      onChangeText={setEventNote}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveEvent}
                    />
                    <View style={styles.eventFormActions}>
                      <TouchableOpacity onPress={handleCancelEventForm} activeOpacity={0.7}>
                        <Text style={[styles.eventCancelText, { color: colors.bright }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.eventSaveBtn, { backgroundColor: eventTitle.trim() ? colors.accent : colors.surface2 }]}
                        onPress={handleSaveEvent}
                        disabled={!eventTitle.trim()}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.eventSaveBtnText, { color: colors.white }]}>
                          {editingEvent ? 'Save changes' : 'Add event'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.addEventBtn, { borderColor: colors.accent }]}
                    onPress={() => setShowEventForm(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addEventBtnText, { color: colors.accent }]}>+ Add event</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* PAST */}
            {!selectedIsFuture && (
              <>
                {selectedEvents.length > 0 && (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                        Events <Text style={[styles.modalSectionEm, { color: colors.accent }]}>that day</Text>
                      </Text>
                      <View style={styles.eventList}>
                        {selectedEvents.map(ev => (
                          <View key={ev.id} style={[styles.eventCard, { backgroundColor: colors.surface }]}>
                            <View style={[styles.eventCardAccent, { backgroundColor: colors.accent }]} />
                            <View style={styles.eventCardBody}>
                              <Text style={[styles.eventCardTitle, { color: colors.bright }]}>{ev.title}</Text>
                              {ev.note ? <Text style={[styles.eventCardNote, { color: colors.bright }]}>{ev.note}</Text> : null}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.bright }]} />
                  </>
                )}

                {selectedPhoto && (
                  <>
                    <View style={styles.modalSection}>
                      <Image source={{ uri: selectedPhoto }} style={styles.modalPhoto} resizeMode="cover" />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.bright }]} />
                  </>
                )}

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                    Feelings <Text style={[styles.modalSectionEm, { color: colors.accent }]}>that day</Text>
                  </Text>
                  {selectedEmotionDetails.length === 0 ? (
                    <Text style={[styles.modalEmpty, { color: colors.bright }]}>No emotions logged.</Text>
                  ) : (
                    <View style={styles.chipRow}>
                      {selectedEmotionDetails.map(e => (
                        <View key={e.id} style={[styles.chip, { backgroundColor: colors.surface }]}>
                          <Text style={styles.chipEmoji}>{e.emoji}</Text>
                          <Text style={[styles.chipLabel, { color: colors.bright }]}>{e.label}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.divider, { backgroundColor: colors.bright }]} />

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                    Habits <Text style={[styles.modalSectionEm, { color: colors.accent }]}>that day</Text>
                  </Text>
                  {selectedHabitDetails.length === 0 ? (
                    <Text style={[styles.modalEmpty, { color: colors.bright }]}>No habits logged.</Text>
                  ) : (
                    <View style={styles.habitRow}>
                      {selectedHabitDetails.map(h => (
                        <View key={h.id} style={[styles.habitChip, { backgroundColor: colors.surface }]}>
                          <Text style={styles.chipEmoji}>{h.emoji}</Text>
                          <Text style={[styles.chipLabel, { color: colors.bright }]}>{h.label}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.divider, { backgroundColor: colors.bright }]} />

                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                    {selectedThoughts.length}{' '}
                    <Text style={[styles.modalSectionEm, { color: colors.accent }]}>
                      {plural(selectedThoughts.length, 'thought', 'thoughts')}
                    </Text>
                  </Text>
                  {selectedThoughts.length === 0 ? (
                    <Text style={[styles.modalEmpty, { color: colors.bright }]}>No entries written.</Text>
                  ) : (
                    selectedThoughts.map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.thoughtEntry, { borderTopColor: colors.bright }]}
                        onLongPress={() => confirmDelete(t.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thoughtMeta}>
                          <Text style={[styles.thoughtTime, { color: colors.bright }]}>
                            {new Date(t.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <FormattedText text={t.body} style={[styles.thoughtBody, { color: colors.bright }]} />
                      </TouchableOpacity>
                    ))
                  )}
                  {selectedThoughts.length > 0 && (
                    <Text style={[styles.deleteHint, { color: colors.bright }]}>Long-press a thought to delete</Text>
                  )}
                </View>

                {selectedVoiceNotes.length > 0 && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.bright }]} />
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalSectionTitle, { color: colors.bright }]}>
                        Voice <Text style={[styles.modalSectionEm, { color: colors.accent }]}>notes</Text>
                      </Text>
                      {selectedVoiceNotes.map(note => (
                        <View key={note.id} style={styles.voiceNoteItem}>
                          <VoiceNotePlayback
                            note={note}
                            onDelete={() => onDeleteVoiceNote(note.id)}
                          />
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 60 },

  pageTitle: { fontFamily: 'Georgia', fontSize: 32, fontWeight: '300', letterSpacing: -0.5, marginBottom: 4 },
  pageTitleEm: { fontStyle: 'italic' },
  pageSubtitle: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, marginBottom: 16 },

  divider: { height: 1, marginVertical: 16 },

  section: { marginBottom: 0 },
  sectionTitle: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '300', letterSpacing: -0.3, marginBottom: 18 },
  sectionTitleEm: { fontStyle: 'italic' },
  emptyText: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13 },

  weekStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weekStatCell: { width: '30%', flexGrow: 1, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', gap: 4 },
  weekStatEmoji: { fontSize: 18 },
  weekStatNum: { fontFamily: 'Georgia', fontSize: 24, fontWeight: '300', lineHeight: 28 },
  weekStatLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' },

  barChart: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barEmoji: { fontSize: 15, width: 22 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barLabel: { fontFamily: 'System', fontSize: 10, fontWeight: '500', width: 68 },
  barCount: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 12, width: 20, textAlign: 'right' },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  monthNavBtn: { padding: 8 },
  monthNavArrow: { fontFamily: 'System', fontSize: 18, fontWeight: '300' },
  monthTitleWrap: { alignItems: 'center', flex: 1 },
  monthTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '300', letterSpacing: -0.3 },
  monthTitleYear: { fontStyle: 'italic' },
  todayHint: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 },

  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dowLabel: { width: DAY_SIZE, textAlign: 'center', fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: DAY_SIZE, height: DAY_SIZE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, margin: 1 },
  calCellEmpty: { width: DAY_SIZE, height: DAY_SIZE, margin: 1 },
  calDayNum: { fontFamily: 'System', fontSize: 11, fontWeight: '500' },
  calDotRow: { position: 'absolute', bottom: Math.floor(DAY_SIZE * 0.18), left: Math.floor(DAY_SIZE * 0.18), right: Math.floor(DAY_SIZE * 0.18), flexDirection: 'row', justifyContent: 'space-between' },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  calDotPlaceholder: { width: 4, height: 4 },

  legend: { flexDirection: 'row', gap: 18, marginTop: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendCell: { width: 16, height: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  legendCellNum: { fontFamily: 'System', fontSize: 8, fontWeight: '700' },
  legendText: { fontFamily: 'System', fontSize: 9, fontWeight: '500', letterSpacing: 0.3 },

  modal: { flex: 1 },
  modalContent: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalHeaderLeft: { flex: 1, gap: 8 },
  modalDate: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 22, fontWeight: '300', letterSpacing: -0.3, lineHeight: 28 },
  modalFuturePill: { fontFamily: 'System', fontSize: 8, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  modalClose: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', paddingTop: 4 },
  modalPhoto: { width: '100%', height: 220, marginBottom: 4 },
  modalSection: { marginBottom: 0 },
  modalSectionTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '300', marginBottom: 16 },
  modalSectionEm: { fontStyle: 'italic' },
  modalEmpty: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13 },

  eventList: { gap: 10, marginBottom: 16 },
  eventCard: { flexDirection: 'row', overflow: 'hidden' },
  eventCardAccent: { width: 3 },
  eventCardBody: { flex: 1, padding: 14 },
  eventCardTitle: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16, fontWeight: '300', marginBottom: 3 },
  eventCardNote: { fontFamily: 'System', fontSize: 11, lineHeight: 17 },
  eventCardActions: { flexDirection: 'column', justifyContent: 'center', gap: 10, paddingHorizontal: 14 },
  eventActionText: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  addEventBtn: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start' },
  addEventBtnText: { fontFamily: 'System', fontSize: 10, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  eventForm: { padding: 18, gap: 14 },
  eventFormLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  eventFormInput: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 17, paddingVertical: 8, borderBottomWidth: 1 },
  eventFormNote: { fontFamily: 'System', fontSize: 13, paddingVertical: 8, borderBottomWidth: 1 },
  eventFormActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  eventCancelText: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },
  eventSaveBtn: { paddingHorizontal: 18, paddingVertical: 10 },
  eventSaveBtnText: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 11 },
  chipEmoji: { fontSize: 13 },
  chipLabel: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },

  habitRow: { flexDirection: 'column', gap: 8 },
  habitChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14 },

  longestCard: { borderWidth: 1, padding: 16, gap: 10 },
  longestMeta: { flexDirection: 'row', alignItems: 'baseline' },
  longestNum: { fontFamily: 'Georgia', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  longestUnits: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  longestDate: { fontFamily: 'System', fontSize: 8, fontWeight: '400', letterSpacing: 0.6, opacity: 0.5 },
  longestExcerpt: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, lineHeight: 24 },

  thoughtEntry: { paddingVertical: 16, borderTopWidth: 1 },
  thoughtMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  thoughtTime: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase' },
  thoughtBody: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, lineHeight: 25 },
  deleteHint: { fontFamily: 'System', fontSize: 9, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  voiceNoteItem: { marginBottom: 8 },
});