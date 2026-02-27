import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../context/ThemeContext';
import { getDailyQuote } from '../constants/data';
import { Thought, UserStats } from '../hooks/useThoughts';
import { EMOTIONS } from '../hooks/useEmotions';
import { HABITS } from '../hooks/useHabits';
import { VoiceNote } from '../hooks/useVoiceNotes';
import { VoiceNoteRecorder, VoiceNotePlayback } from './VoiceNoteRecorder';
import { FormattedText } from './FormattedText';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  thoughts: Thought[];
  user: UserStats;
  onAdd: (body: string, tag: string) => void;
  todayEmotions: string[];
  onToggleEmotion: (id: string) => void;
  onConfirmSave: (emotions: string[]) => Promise<void>;
  emotionsSaved: boolean;
  todayPhoto: string | null;
  onSavePhoto: (uri: string) => Promise<void>;
  onRemovePhoto: () => Promise<void>;
  todayHabits: string[];
  onToggleHabit: (id: string) => void;
  onConfirmHabitSave: (habits: string[]) => Promise<void>;
  habitsSaved: boolean;
  todayVoiceNotes: VoiceNote[];
  onAddVoiceNote: (uri: string, durationMs: number) => Promise<void>;
  onDeleteVoiceNote: (id: string) => Promise<void>;
}

export default function DashboardScreen({
  thoughts, user, onAdd,
  todayEmotions, onToggleEmotion, onConfirmSave, emotionsSaved,
  todayPhoto, onSavePhoto, onRemovePhoto,
  todayHabits, onToggleHabit, onConfirmHabitSave, habitsSaved,
  todayVoiceNotes, onAddVoiceNote, onDeleteVoiceNote,
}: Props) {
  const { colors } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const quote = getDailyQuote();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  async function handleSave() {
    const trimmed = htmlToText(body).trim();
    if (!trimmed) { Alert.alert('Empty entry', 'Write something before saving.'); return; }
    setSaving(true);
    await onAdd(body, '');
    setBody('');
    setSaving(false);
  }

  // Strip HTML tags to get plain text (used for empty-check and save button state)
  function htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ');
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await onSavePhoto(result.assets[0].uri);
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await onSavePhoto(result.assets[0].uri);
  }

  function handlePhotoPress() {
    if (todayPhoto) {
      Alert.alert('Today\'s photo', 'What would you like to do?', [
        { text: 'Replace', onPress: () => showPickOptions() },
        { text: 'Remove', style: 'destructive', onPress: onRemovePhoto },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      showPickOptions();
    }
  }

  function showPickOptions() {
    Alert.alert('Add a photo', '', [
      { text: 'Take photo', onPress: handleTakePhoto },
      { text: 'Choose from library', onPress: handlePickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const streakPosition = user.streak === 0 ? 0 : ((user.streak - 1) % 7) + 1;
  const streakCycle = user.streak === 0 ? 0 : Math.ceil(user.streak / 7);

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          <Text style={[styles.date, { color: colors.bright }]}>{today}</Text>

          <Text style={[styles.title, { color: colors.bright }]}>
            What are{'\n'}you <Text style={[styles.titleEm, { color: colors.accent }]}>thinking?</Text>
          </Text>

          <View style={[styles.quoteWrap, { borderBottomColor: colors.bright }]}>
            <View style={[styles.quoteBorder, { backgroundColor: colors.accent }]} />
            <Text style={[styles.quote, { color: colors.bright }]}>"{quote}"</Text>
          </View>

          {/* Streak bar */}
          <View style={styles.streakWrap}>
            <View style={styles.streakHeader}>
              <Text style={[styles.streakCount, { color: colors.accent }]}>{user.streak}</Text>
              <Text style={[styles.streakLabel, { color: colors.bright }]}> day streak</Text>
              {streakCycle > 1 && (
                <Text style={[styles.streakCycle, { color: colors.muted }]}> · cycle {streakCycle}</Text>
              )}
            </View>
            <View style={styles.streakSegments}>
              {Array.from({ length: 7 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.streakSegment,
                    { backgroundColor: (i + 1) <= streakPosition ? colors.accent : colors.surface2 },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.streakDayHint, { color: colors.muted }]}>
              {user.streak === 0 ? 'Start your streak — write today' : `Day ${streakPosition} of 7`}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          <TouchableOpacity
            style={[styles.composeTrigger, { borderColor: colors.bright }]}
            onPress={() => setEditorOpen(true)}
            activeOpacity={0.7}
          >
            {htmlToText(body).trim() ? (
              <FormattedText
                text={body}
                style={[styles.composeTriggerText, { color: colors.text }]}
                numberOfLines={2}
              />
            ) : (
              <Text style={[styles.composeTriggerText, { color: colors.bright }]} numberOfLines={2}>
                {'Begin anywhere. There\'s no wrong way in…'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Emotion tracker */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              How are you <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>feeling?</Text>
            </Text>

            {/* 2-column grid: pair up emotions */}
            <View style={styles.emotionGrid}>
              {Array.from({ length: Math.ceil(EMOTIONS.length / 2) }).map((_, rowIdx) => {
                const left = EMOTIONS[rowIdx * 2];
                const right = EMOTIONS[rowIdx * 2 + 1];
                return (
                  <View key={rowIdx} style={styles.emotionRow}>
                    {[left, right].map((e, colIdx) => {
                      if (!e) return <View key={colIdx} style={styles.emotionCell} />;
                      const active = (todayEmotions ?? []).includes(e.id);
                      return (
                        <TouchableOpacity
                          key={e.id}
                          style={[
                            styles.emotionCell,
                            { borderColor: 'transparent', backgroundColor: colors.bg },
                            active && { borderColor: colors.accent },
                          ]}
                          onPress={() => onToggleEmotion(e.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                          <Text style={[
                            styles.emotionLabel, { color: colors.bright },
                            active && { color: colors.accent },
                          ]}>{e.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {(todayEmotions ?? []).length > 0 && (
              <View style={styles.trackFooter}>
                {emotionsSaved ? (
                  <Text style={[styles.savedConfirm, { color: colors.accent }]}>✓ Saved for today</Text>
                ) : (
                  <TouchableOpacity
                    style={[styles.doneBtn, { borderColor: colors.accent }]}
                    onPress={() => onConfirmSave(todayEmotions)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.doneBtnText, { color: colors.accent }]}>
                      Done — save {todayEmotions.length} feeling{todayEmotions.length > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Habit tracker */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              Today's <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>habits.</Text>
            </Text>
            <View style={styles.habitGrid}>
              {HABITS.map((h) => {
                const active = (todayHabits ?? []).includes(h.id);
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[
                      styles.habitPill,
                      { borderColor: 'transparent', backgroundColor: colors.bg },
                      active && { borderColor: colors.accent },
                    ]}
                    onPress={() => onToggleHabit(h.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.habitEmoji}>{h.emoji}</Text>
                    <Text style={[
                      styles.habitLabel, { color: colors.bright },
                      active && { color: colors.accent },
                    ]}>{h.label}</Text>
                    {active && (
                      <View style={[styles.habitCheck, { backgroundColor: colors.accent }]}>
                        <Text style={styles.habitCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {(todayHabits ?? []).length > 0 && (
              <View style={styles.trackFooter}>
                {habitsSaved ? (
                  <Text style={[styles.savedConfirm, { color: colors.accent }]}>✓ Saved for today</Text>
                ) : (
                  <TouchableOpacity
                    style={[styles.doneBtn, { borderColor: colors.accent }]}
                    onPress={() => onConfirmHabitSave(todayHabits)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.doneBtnText, { color: colors.accent }]}>
                      Done — save {todayHabits.length} habit{todayHabits.length > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Photo */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              Today's <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>moment.</Text>
            </Text>
            {todayPhoto ? (
              <TouchableOpacity onPress={handlePhotoPress} activeOpacity={0.9}>
                <Image source={{ uri: todayPhoto }} style={styles.photo} resizeMode="cover" />
                <Text style={[styles.photoHint, { color: colors.bright }]}>Tap to replace or remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.photoPlaceholder, { borderColor: colors.bright, backgroundColor: colors.surface }]}
                onPress={handlePhotoPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.photoPlaceholderIcon, { color: colors.bright }]}>◻</Text>
                <Text style={[styles.photoPlaceholderText, { color: colors.bright }]}>Add a photo to today's log</Text>
                <Text style={[styles.photoPlaceholderHint, { color: colors.bright }]}>camera or library</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.bright }]} />

          {/* Voice notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              Today's <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>voice.</Text>
            </Text>
            {todayVoiceNotes.map(note => (
              <View key={note.id} style={styles.voiceNoteItem}>
                <VoiceNotePlayback
                  note={note}
                  onDelete={() => onDeleteVoiceNote(note.id)}
                />
              </View>
            ))}
            <View style={todayVoiceNotes.length > 0 ? styles.voiceNoteSpacing : undefined}>
              <VoiceNoteRecorder onSave={onAddVoiceNote} />
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Full-screen writing modal */}
      <Modal
        visible={editorOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setEditorOpen(false)}
      >
        <SafeAreaView style={[styles.editorModal, { backgroundColor: colors.bg }]} edges={['bottom']}>
          <View style={[styles.editorHeader, { borderBottomColor: colors.bright, paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => setEditorOpen(false)} activeOpacity={0.7}>
              <Text style={[styles.editorCancel, { color: colors.bright }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.editorTitle, { color: colors.bright }]}>{today}</Text>
            <TouchableOpacity
              onPress={async () => { await handleSave(); setEditorOpen(false); }}
              disabled={saving || !htmlToText(body).trim()}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.editorSave,
                { color: colors.accent },
                (!htmlToText(body).trim() || saving) && { opacity: 0.3 },
              ]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <RichTextEditor value={body} onChangeValue={setBody} />
        </SafeAreaView>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 60 },

  date: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 22 },
  title: { fontFamily: 'Georgia', fontSize: 36, fontWeight: '300', lineHeight: 40, letterSpacing: -0.8, marginBottom: 26 },
  titleEm: { fontStyle: 'italic' },

  quoteWrap: { flexDirection: 'row', gap: 14, marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1 },
  quoteBorder: { width: 1 },
  quote: { flex: 1, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, lineHeight: 22 },

  streakWrap: { marginBottom: 8 },
  streakHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  streakCount: { fontFamily: 'Georgia', fontSize: 30, fontWeight: '300', lineHeight: 34 },
  streakLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 6 },
  streakCycle: { fontFamily: 'System', fontSize: 8, fontWeight: '400', letterSpacing: 0.6 },
  streakSegments: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  streakSegment: { flex: 1, height: 4, borderRadius: 2 },
  streakDayHint: { fontFamily: 'System', fontSize: 8, fontWeight: '400', letterSpacing: 0.8, textTransform: 'uppercase' },

  divider: { height: 1, marginVertical: 24 },

  composeTrigger: { borderWidth: 1, borderStyle: 'dashed', paddingVertical: 16, paddingHorizontal: 14, marginBottom: 0 },
  composeTriggerText: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, lineHeight: 24 },
  editorModal: { flex: 1 },
  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1 },
  editorTitle: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  editorCancel: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },
  editorSave: { fontFamily: 'System', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  section: { marginBottom: 0 },
  sectionTitle: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '300', letterSpacing: -0.3, marginBottom: 18 },
  sectionTitleEm: { fontStyle: 'italic' },

  // Emotion 2-column grid
  emotionGrid: { flexDirection: 'column', gap: 8, marginBottom: 0 },
  emotionRow: { flexDirection: 'row', gap: 8 },
  emotionCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  emotionEmoji: { fontSize: 15 },
  emotionLabel: { fontFamily: 'System', fontSize: 10, fontWeight: '500', flexShrink: 1 },

  // Habit tracker
  habitGrid: { flexDirection: 'column', gap: 10, marginBottom: 0 },
  habitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1,
  },
  habitEmoji: { fontSize: 18 },
  habitLabel: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, fontWeight: '300', flex: 1 },
  habitCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitCheckMark: { color: '#fff', fontSize: 11, fontWeight: '700' },

  trackFooter: { alignItems: 'flex-start', marginTop: 16 },
  doneBtn: { borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10 },
  doneBtnText: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  savedConfirm: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13 },

  voiceNoteItem: { marginBottom: 8 },
  voiceNoteSpacing: { marginTop: 8 },
  photo: { width: '100%', height: 240, marginBottom: 4 },
  photoHint: { fontFamily: 'System', fontSize: 9, fontStyle: 'italic', marginBottom: 0 },
  photoPlaceholder: { width: '100%', height: 160, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 0 },
  photoPlaceholderIcon: { fontSize: 28 },
  photoPlaceholderText: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14 },
  photoPlaceholderHint: { fontFamily: 'System', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
});