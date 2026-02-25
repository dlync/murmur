import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/theme';
import { TAGS, getDailyQuote } from '../constants/data';
import { Thought, UserStats } from '../hooks/useThoughts';
import { EMOTIONS } from '../hooks/useEmotions';

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
}

export default function DashboardScreen({
  thoughts, user, onAdd,
  todayEmotions, onToggleEmotion, onConfirmSave, emotionsSaved,
  todayPhoto, onSavePhoto, onRemovePhoto,
}: Props) {
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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await onSavePhoto(result.assets[0].uri);
    }
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await onSavePhoto(result.assets[0].uri);
    }
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
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          <Text style={styles.date}>{today}</Text>

          <Text style={styles.title}>
            What are{'\n'}you <Text style={styles.titleEm}>thinking?</Text>
          </Text>

          <View style={styles.quoteWrap}>
            <View style={styles.quoteBorder} />
            <Text style={styles.quote}>"{quote}"</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, styles.accentNum]}>{user.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{user.thoughtsToday}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{user.thoughtsTotal}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Write */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.tagScroll} contentContainerStyle={styles.tagContainer}>
            {TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagPill, activeTag === tag && styles.tagPillActive]}
                onPress={() => setActiveTag(activeTag === tag ? '' : tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={styles.textarea}
            multiline
            placeholder="Begin anywhere. There's no wrong way in…"
            placeholderTextColor={colors.border2}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
          />
          <View style={styles.textareaBorder} />

          <View style={styles.composeFooter}>
            <TouchableOpacity
              style={[styles.saveBtn, (!body.trim() || saving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || !body.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save entry'}</Text>
            </TouchableOpacity>
            <Text style={styles.charCount}>{body.length} / ∞</Text>
          </View>

          <View style={styles.divider} />

          {/* Emotion tracker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              How are you <Text style={styles.sectionTitleEm}>feeling?</Text>
            </Text>
            <View style={styles.emotionGrid}>
              {EMOTIONS.map((e) => {
                const active = (todayEmotions ?? []).includes(e.id);
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.emotionPill, active && styles.emotionPillActive]}
                    onPress={() => onToggleEmotion(e.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                    <Text style={[styles.emotionLabel, active && styles.emotionLabelActive]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {(todayEmotions ?? []).length > 0 && (
              <View style={styles.emotionFooter}>
                {emotionsSaved ? (
                  <Text style={styles.savedConfirm}>✓ Saved for today</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => onConfirmSave(todayEmotions)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneBtnText}>
                      Done — save {todayEmotions.length} feeling{todayEmotions.length > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Photo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Today's <Text style={styles.sectionTitleEm}>moment.</Text>
            </Text>

            {todayPhoto ? (
              <TouchableOpacity onPress={handlePhotoPress} activeOpacity={0.9}>
                <Image source={{ uri: todayPhoto }} style={styles.photo} resizeMode="cover" />
                <Text style={styles.photoHint}>Tap to replace or remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.photoPlaceholder} onPress={handlePhotoPress} activeOpacity={0.7}>
                <Text style={styles.photoPlaceholderIcon}>◻</Text>
                <Text style={styles.photoPlaceholderText}>Add a photo to today's log</Text>
                <Text style={styles.photoPlaceholderHint}>camera or library</Text>
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 60 },

  date: {
    fontFamily: 'System', fontSize: 9, fontWeight: '600',
    letterSpacing: 1.4, textTransform: 'uppercase', color: colors.border2, marginBottom: 22,
  },
  title: {
    fontFamily: 'Georgia', fontSize: 36, fontWeight: '300',
    lineHeight: 40, color: colors.bright, letterSpacing: -0.8, marginBottom: 26,
  },
  titleEm: { fontStyle: 'italic', color: colors.accent },

  quoteWrap: {
    flexDirection: 'row', gap: 14, marginBottom: 28,
    paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: '#ECEAE4',
  },
  quoteBorder: { width: 1, backgroundColor: colors.accent },
  quote: { flex: 1, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, color: colors.border2, lineHeight: 22 },

  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 28 },
  stat: {},
  statNum: { fontFamily: 'Georgia', fontSize: 30, fontWeight: '300', color: colors.bright, lineHeight: 34, marginBottom: 2 },
  accentNum: { color: colors.accent },
  statLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: colors.border2 },

  divider: { height: 1, backgroundColor: '#ECEAE4', marginBottom: 24 },

  tagScroll: { marginBottom: 16 },
  tagContainer: { gap: 18, paddingRight: 4 },
  tagPill: { paddingVertical: 7, paddingHorizontal: 7, borderColor: '#ECEAE4', borderWidth: 1, backgroundColor: colors.bg },
  tagPillActive: { borderColor: colors.accent },
  tagText: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: colors.border2 },
  tagTextActive: { color: colors.accent },

  textarea: { backgroundColor: 'transparent', padding: 0, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16, color: colors.text, lineHeight: 28, minHeight: 140, marginBottom: 12 },
  textareaBorder: { height: 1, backgroundColor: '#ECEAE4', marginBottom: 16 },

  composeFooter: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  saveBtn: { backgroundColor: colors.accent, paddingHorizontal: 22, paddingVertical: 12 },
  saveBtnDisabled: { backgroundColor: colors.border2 },
  saveBtnText: { fontFamily: 'System', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: '#fff' },
  charCount: { marginLeft: 'auto', fontSize: 11, color: colors.border2, fontFamily: 'System' },

  section: { marginBottom: 8 },
  sectionTitle: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '300', color: colors.bright, letterSpacing: -0.3, marginBottom: 18 },
  sectionTitleEm: { fontStyle: 'italic', color: colors.accent },

  emotionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  emotionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ECEAE4', backgroundColor: colors.bg },
  emotionPillActive: { borderColor: colors.accent },
  emotionEmoji: { fontSize: 13 },
  emotionLabel: { fontFamily: 'System', fontSize: 10, fontWeight: '500', color: colors.muted },
  emotionLabelActive: { color: colors.accentD },

  emotionFooter: { alignItems: 'flex-start' },
  doneBtn: { borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10 },
  doneBtnText: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.accent },
  savedConfirm: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, color: colors.accent },

  photo: { width: '100%', height: 220, marginBottom: 8 },
  photoHint: { fontFamily: 'System', fontSize: 9, fontStyle: 'italic', color: colors.border2, marginBottom: 4 },

  photoPlaceholder: {
    width: '100%', height: 160,
    borderWidth: 1, borderColor: '#ECEAE4', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.surface,
  },
  photoPlaceholderIcon: { fontSize: 28, color: colors.border },
  photoPlaceholderText: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, color: colors.muted },
  photoPlaceholderHint: { fontFamily: 'System', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.border2 },
});