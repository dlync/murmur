import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../context/ThemeContext';
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
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
  const streakCycle = user.streak === 0 ? 1 : Math.ceil(user.streak / 7);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header banner */}
      <View style={[styles.headerBanner, { backgroundColor: colors.accent }]}>
        <Text style={[styles.headerDate, { color: colors.white }]}>{today}</Text>
        <Text style={[styles.headerTitle, { color: colors.white }]}>
          What are{'\n'}you <Text style={styles.headerTitleEm}>thinking?</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Streak pill */}
          <View style={[styles.streakCard, { backgroundColor: colors.border }]}>
            <Text style={[styles.streakNum, { color: colors.accent }]}>{user.streak}</Text>
            <View style={styles.streakCardInfo}>
              <Text style={[styles.streakCardLabel, { color: colors.muted }]}>
                Day Streak · cycle {streakCycle}
              </Text>
              <View style={styles.streakSegs}>
                {Array.from({ length: 7 }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.streakSeg,
                      { backgroundColor: (i + 1) <= streakPosition ? colors.accent : colors.surface2 },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Compose box */}
          <View style={[styles.composeBox, { backgroundColor: colors.surface, borderColor: colors.border2 }]}>
            <TouchableOpacity onPress={() => setEditorOpen(true)} activeOpacity={0.7}>
              {htmlToText(body).trim() ? (
                <FormattedText
                  text={body}
                  style={[styles.composePlaceholder, { color: colors.text }]}
                  numberOfLines={2}
                />
              ) : (
                <Text style={[styles.composePlaceholder, { color: colors.muted }]}>
                  Begin anywhere. There's no wrong way in…
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.composeActions}>
              <TouchableOpacity
                style={[styles.composeBtnPrimary, { backgroundColor: colors.accent }]}
                onPress={() => setEditorOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.composeBtnText, { color: colors.white }]}>Write ✦</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.composeBtnSecondary, { backgroundColor: colors.accentL }]}
                onPress={() => setVoiceModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.composeBtnText, { color: colors.accentD }]}>🎙 Record</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Emotion tracker */}
          <Text style={[styles.sectionTitle, { color: colors.bright }]}>
            How are you <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>feeling?</Text>
          </Text>
          <View style={styles.emotionChips}>
            {Array.from({ length: 5 }, (_, i) => (
              <View key={i} style={styles.emotionRow}>
                {[EMOTIONS[i * 2], EMOTIONS[i * 2 + 1]].map((e) => {
                  const active = (todayEmotions ?? []).includes(e.id);
                  return (
                    <TouchableOpacity
                      key={e.id}
                      style={[
                        styles.emotionChip,
                        { backgroundColor: active ? colors.accent : colors.surface },
                      ]}
                      onPress={() => onToggleEmotion(e.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                      <Text style={[styles.emotionLabel, { color: active ? colors.white : colors.dim }]}>
                        {e.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
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

          {/* Habit tracker */}
          <Text style={[styles.sectionTitle, { color: colors.bright }]}>
            Today's <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>habits.</Text>
          </Text>
          <View style={styles.habitList}>
            {HABITS.map((h) => {
              const active = (todayHabits ?? []).includes(h.id);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.habitItem,
                    { backgroundColor: colors.surface, borderColor: active ? colors.accent : 'transparent' },
                  ]}
                  onPress={() => onToggleHabit(h.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.habitEmoji}>{h.emoji}</Text>
                  <Text style={[styles.habitLabel, { color: colors.bright }]}>{h.label}</Text>
                  {active && (
                    <View style={[styles.habitCheck, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.habitCheckMark, { color: colors.white }]}>✓</Text>
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

          {/* Photo */}
          <Text style={[styles.sectionTitle, { color: colors.bright }]}>
            Today's <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>moment.</Text>
          </Text>
          {todayPhoto ? (
            <TouchableOpacity onPress={handlePhotoPress} activeOpacity={0.9}>
              <Image source={{ uri: todayPhoto }} style={styles.photo} resizeMode="cover" />
              <Text style={[styles.photoHint, { color: colors.muted }]}>Tap to replace or remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.photoPlaceholder, { borderColor: colors.border2, backgroundColor: colors.surface }]}
              onPress={handlePhotoPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.photoPlaceholderIcon, { color: colors.muted }]}>◻</Text>
              <Text style={[styles.photoPlaceholderText, { color: colors.muted }]}>Add a photo to today's log</Text>
              <Text style={[styles.photoPlaceholderHint, { color: colors.muted }]}>camera or library</Text>
            </TouchableOpacity>
          )}

          {/* Voice notes */}
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

        </Animated.View>
      </ScrollView>

      {/* Voice modal (shortcut from compose Record button) */}
      <Modal
        visible={voiceModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVoiceModalOpen(false)}
      >
        <SafeAreaView style={[styles.voiceModal, { backgroundColor: colors.bg }]} edges={['bottom', 'top']}>
          <View style={[styles.voiceModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.voiceModalTitle, { color: colors.bright }]}>Record a voice note</Text>
            <TouchableOpacity onPress={() => setVoiceModalOpen(false)} activeOpacity={0.7}>
              <Text style={[styles.voiceModalClose, { color: colors.bright }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.voiceModalBody}>
            <VoiceNoteRecorder
              onSave={async (uri, ms) => {
                await onAddVoiceNote(uri, ms);
                setVoiceModalOpen(false);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Full-screen writing modal */}
      <Modal
        visible={editorOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setEditorOpen(false)}
      >
        <SafeAreaView style={[styles.editorModal, { backgroundColor: colors.bg }]} edges={['bottom']}>
          <View style={[styles.editorHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
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

  // Header banner
  headerBanner: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, borderBottomLeftRadius: 30, borderBottomRightRadius: 30},
  headerDate: {
    fontFamily: 'DMSans_700Bold', fontSize: 9,
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: 'Fraunces_900Black', fontSize: 26,
    textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 30,
  },
  headerTitleEm: { fontFamily: 'Fraunces_900Black_Italic', textTransform: 'none' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 },

  // Streak pill card
  streakCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 50, paddingVertical: 10, paddingHorizontal: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  streakNum: { fontFamily: 'Fraunces_900Black', fontSize: 30, lineHeight: 34 },
  streakCardInfo: { flex: 1 },
  streakCardLabel: {
    fontFamily: 'DMSans_700Bold', fontSize: 8,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  streakSegs: { flexDirection: 'row', gap: 4 },
  streakSeg: { flex: 1, height: 4, borderRadius: 2 },

  // Compose box
  composeBox: { borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', padding: 14, marginBottom: 24 },
  composePlaceholder: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 13, lineHeight: 22, marginBottom: 12 },
  composeActions: { flexDirection: 'row', gap: 8 },
  composeBtnPrimary: { borderRadius: 50, paddingVertical: 7, paddingHorizontal: 16 },
  composeBtnSecondary: { borderRadius: 50, paddingVertical: 7, paddingHorizontal: 16 },
  composeBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },

  // Section titles
  sectionTitle: {
    fontFamily: 'Fraunces_900Black', fontSize: 13,
    textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 12, marginTop: 8,
  },
  sectionTitleEm: { fontFamily: 'Fraunces_300Light_Italic', textTransform: 'none' },

  // Emotion chips
  emotionChips: { gap: 7, marginBottom: 12 },
  emotionRow: { flexDirection: 'row', gap: 7 },
  emotionChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 50, paddingVertical: 7, paddingHorizontal: 4 },
  emotionEmoji: { fontSize: 13 },
  emotionLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 10 },

  // Habit items
  habitList: { gap: 6, marginBottom: 12 },
  habitItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1.5,
  },
  habitEmoji: { fontSize: 16 },
  habitLabel: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 14, flex: 1 },
  habitCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitCheckMark: { fontSize: 10, fontWeight: '700' },

  trackFooter: { alignItems: 'flex-start', marginTop: 10, marginBottom: 20 },
  doneBtn: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 8 },
  doneBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  savedConfirm: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 13 },

  voiceNoteItem: { marginBottom: 8 },
  voiceNoteSpacing: { marginTop: 8 },
  photo: { width: '100%', height: 240, borderRadius: 12, marginBottom: 4 },
  photoHint: { fontFamily: 'DMSans_400Regular', fontSize: 9, marginBottom: 0 },
  photoPlaceholder: {
    width: '100%', height: 140, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoPlaceholderIcon: { fontSize: 24 },
  photoPlaceholderText: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 13 },
  photoPlaceholderHint: { fontFamily: 'DMSans_700Bold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },

  // Voice modal
  voiceModal: { flex: 1 },
  voiceModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1,
  },
  voiceModalTitle: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 18 },
  voiceModalClose: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  voiceModalBody: { flex: 1, padding: 28 },

  // Editor modal
  editorModal: { flex: 1 },
  editorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  editorTitle: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  editorCancel: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },
  editorSave: { fontFamily: 'System', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});
