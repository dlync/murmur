import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../context/ThemeContext';
import { TAGS, getDailyQuote } from '../constants/data';
import { Thought, UserStats } from '../hooks/useThoughts';
import { EMOTIONS } from '../hooks/useEmotions';
import { HABITS } from '../hooks/useHabits';

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
}

export default function DashboardScreen({
  thoughts, user, onAdd,
  todayEmotions, onToggleEmotion, onConfirmSave, emotionsSaved,
  todayPhoto, onSavePhoto, onRemovePhoto,
  todayHabits, onToggleHabit, onConfirmHabitSave, habitsSaved,
}: Props) {
  const { colors } = useContext(ThemeContext);
  const [body, setBody] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const quote = getDailyQuote();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  async function handleSave() {
    const trimmed = body.trim();
    if (!trimmed) { Alert.alert('Empty entry', 'Write something before saving.'); return; }
    setSaving(true);
    await onAdd(trimmed, activeTag);
    setBody('');
    setActiveTag('');
    setSaving(false);
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

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          <Text style={[styles.date, { color: colors.border2 }]}>{today}</Text>

          <Text style={[styles.title, { color: colors.bright }]}>
            What are{'\n'}you <Text style={[styles.titleEm, { color: colors.accent }]}>thinking?</Text>
          </Text>

          <View style={[styles.quoteWrap, { borderBottomColor: colors.border }]}>
            <View style={[styles.quoteBorder, { backgroundColor: colors.accent }]} />
            <Text style={[styles.quote, { color: colors.border2 }]}>"{quote}"</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.accent }]}>{user.streak}</Text>
              <Text style={[styles.statLabel, { color: colors.border2 }]}>Streak</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsToday}</Text>
              <Text style={[styles.statLabel, { color: colors.border2 }]}>Today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsTotal}</Text>
              <Text style={[styles.statLabel, { color: colors.border2 }]}>Total</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Tag pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.tagScroll} contentContainerStyle={styles.tagContainer}>
            {TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagPill,
                  { borderColor: colors.border, backgroundColor: colors.bg },
                  activeTag === tag && { borderColor: colors.accent },
                ]}
                onPress={() => setActiveTag(activeTag === tag ? '' : tag)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tagText, { color: colors.border2 },
                  activeTag === tag && { color: colors.accent },
                ]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={[styles.textarea, { color: colors.text }]}
            multiline
            placeholder="Begin anywhere. There's no wrong way in…"
            placeholderTextColor={colors.border2}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
          />
          <View style={[styles.textareaBorder, { backgroundColor: colors.border }]} />

          <View style={styles.composeFooter}>
            <TouchableOpacity
              style={[
                styles.saveBtn, { backgroundColor: colors.accent },
                (!body.trim() || saving) && { backgroundColor: colors.border2 },
              ]}
              onPress={handleSave}
              disabled={saving || !body.trim()}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveBtnText, { color: colors.white }]}>
                {saving ? 'Saving…' : 'Save entry'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.charCount, { color: colors.border2 }]}>{body.length} / ∞</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Emotion tracker */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              How are you <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>feeling?</Text>
            </Text>
            <View style={styles.emotionGrid}>
              {EMOTIONS.map((e) => {
                const active = (todayEmotions ?? []).includes(e.id);
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.emotionPill,
                      { borderColor: colors.border, backgroundColor: colors.bg },
                      active && { borderColor: colors.accent },
                    ]}
                    onPress={() => onToggleEmotion(e.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                    <Text style={[
                      styles.emotionLabel, { color: colors.muted },
                      active && { color: colors.accentD },
                    ]}>{e.label}</Text>
                  </TouchableOpacity>
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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
                      { borderColor: colors.border, backgroundColor: colors.bg },
                      active && { borderColor: colors.accent, backgroundColor: colors.accentL },
                    ]}
                    onPress={() => onToggleHabit(h.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.habitEmoji}>{h.emoji}</Text>
                    <Text style={[
                      styles.habitLabel, { color: colors.muted },
                      active && { color: colors.accentD },
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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Photo */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.bright }]}>
              Today's <Text style={[styles.sectionTitleEm, { color: colors.accent }]}>moment.</Text>
            </Text>
            {todayPhoto ? (
              <TouchableOpacity onPress={handlePhotoPress} activeOpacity={0.9}>
                <Image source={{ uri: todayPhoto }} style={styles.photo} resizeMode="cover" />
                <Text style={[styles.photoHint, { color: colors.border2 }]}>Tap to replace or remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handlePhotoPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.photoPlaceholderIcon, { color: colors.border2 }]}>◻</Text>
                <Text style={[styles.photoPlaceholderText, { color: colors.muted }]}>Add a photo to today's log</Text>
                <Text style={[styles.photoPlaceholderHint, { color: colors.border2 }]}>camera or library</Text>
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
      </ScrollView>
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

  quoteWrap: { flexDirection: 'row', gap: 14, marginBottom: 28, paddingBottom: 28, borderBottomWidth: 1 },
  quoteBorder: { width: 1 },
  quote: { flex: 1, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, lineHeight: 22 },

  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 28 },
  stat: {},
  statNum: { fontFamily: 'Georgia', fontSize: 30, fontWeight: '300', lineHeight: 34, marginBottom: 2 },
  statLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },

  divider: { height: 1, marginBottom: 24 },

  tagScroll: { marginBottom: 16 },
  tagContainer: { gap: 18, paddingRight: 4 },
  tagPill: { paddingVertical: 7, paddingHorizontal: 7, borderWidth: 1 },
  tagText: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase' },

  textarea: { backgroundColor: 'transparent', padding: 0, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16, lineHeight: 28, minHeight: 140, marginBottom: 12 },
  textareaBorder: { height: 1, marginBottom: 16 },

  composeFooter: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  saveBtn: { paddingHorizontal: 22, paddingVertical: 12 },
  saveBtnText: { fontFamily: 'System', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  charCount: { marginLeft: 'auto', fontSize: 11, fontFamily: 'System' },

  section: { marginBottom: 8 },
  sectionTitle: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '300', letterSpacing: -0.3, marginBottom: 18 },
  sectionTitleEm: { fontStyle: 'italic' },

  emotionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  emotionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  emotionEmoji: { fontSize: 13 },
  emotionLabel: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },

  // Habit tracker
  habitGrid: { flexDirection: 'column', gap: 10, marginBottom: 20 },
  habitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1,
  },
  habitEmoji: { fontSize: 18 },
  habitLabel: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, fontWeight: '300', flex: 1 },
  habitCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitCheckMark: { color: '#fff', fontSize: 11, fontWeight: '700' },

  trackFooter: { alignItems: 'flex-start' },
  doneBtn: { borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10 },
  doneBtnText: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  savedConfirm: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13 },

  photo: { width: '100%', height: 220, marginBottom: 8 },
  photoHint: { fontFamily: 'System', fontSize: 9, fontStyle: 'italic', marginBottom: 4 },
  photoPlaceholder: { width: '100%', height: 160, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoPlaceholderIcon: { fontSize: 28 },
  photoPlaceholderText: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14 },
  photoPlaceholderHint: { fontFamily: 'System', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
});