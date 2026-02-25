import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { colors } from '../constants/theme';
import { UserStats } from '../hooks/useThoughts';
import { TAGS } from '../constants/data';

interface Props {
  user: UserStats;
  thoughts: Array<{ tag: string; timestamp: string }>;
  onUpdateUsername: (name: string) => void;
}

export default function ProfileScreen({ user, thoughts, onUpdateUsername }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.username);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onUpdateUsername(trimmed);
    setEditingName(false);
  }

  // Tag distribution
  const tagCounts = TAGS.map((tag) => ({
    tag,
    count: thoughts.filter((t) => t.tag === tag).length,
  })).sort((a, b) => b.count - a.count);

  // Month activity (last 30 days)
  const now = Date.now();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * 86400000);
    const dateStr = d.toDateString();
    const count = thoughts.filter(
      (t) => new Date(t.timestamp).toDateString() === dateStr
    ).length;
    return { date: d, count };
  });

  // Words written estimate
  const totalWords = thoughts.reduce((acc, t) => {
    // thoughts here is actually full Thought objects cast
    return acc + ((t as any).body?.split(/\s+/).length || 0);
  }, 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.ruleRow}>
            <View style={styles.rule} />
            <Text style={styles.eyebrow}>Your profile</Text>
          </View>
          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.editHint}>Tap to edit name</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={[styles.statNum, styles.accentNum]}>{user.streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={[styles.statCell, styles.cellBorderLeft]}>
            <Text style={styles.statNum}>{user.thoughtsToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={[styles.statCell, styles.cellBorderLeft]}>
            <Text style={styles.statNum}>{user.thoughtsTotal}</Text>
            <Text style={styles.statLabel}>Total entries</Text>
          </View>
          <View style={[styles.statCell, styles.cellBorderTop]}>
            <Text style={styles.statNum}>{totalWords}</Text>
            <Text style={styles.statLabel}>Words written</Text>
          </View>
          <View style={[styles.statCell, styles.cellBorderTop, styles.cellBorderLeft]}>
            <Text style={styles.statNum}>
              {new Set(thoughts.map((t) => t.tag).filter(Boolean)).size}
            </Text>
            <Text style={styles.statLabel}>Tags used</Text>
          </View>
          <View style={[styles.statCell, styles.cellBorderTop, styles.cellBorderLeft]}>
            <Text style={styles.statNum}>
              {thoughts.length > 0
                ? Math.round(totalWords / thoughts.length)
                : 0}
            </Text>
            <Text style={styles.statLabel}>Avg. words</Text>
          </View>
        </View>

        {/* Activity grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Last 30 days</Text>
        </View>
        <View style={styles.activityGrid}>
          {days.map((d, i) => (
            <View
              key={i}
              style={[
                styles.activityCell,
                d.count > 0 && d.count < 2 && styles.activityDone,
                d.count >= 2 && d.count < 4 && styles.activityMid,
                d.count >= 4 && styles.activityHigh,
                d.date.toDateString() === new Date().toDateString() && styles.activityToday,
              ]}
            />
          ))}
        </View>
        <Text style={styles.activityHint}>Each cell = one day · shade = entries written</Text>

        {/* Tag distribution */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>By tag</Text>
        </View>
        <View style={styles.tagList}>
          {tagCounts.map(({ tag, count }) => (
            <View key={tag} style={styles.tagRow}>
              <Text style={styles.tagLabel}>{tag}</Text>
              <View style={styles.tagBarBg}>
                <View
                  style={[
                    styles.tagBar,
                    { width: `${Math.max(4, (count / Math.max(1, user.thoughtsTotal)) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.tagCount}>{count}</Text>
            </View>
          ))}
          <View style={styles.tagRow}>
            <Text style={styles.tagLabel}>untagged</Text>
            <View style={styles.tagBarBg}>
              <View
                style={[
                  styles.tagBar,
                  styles.tagBarMuted,
                  {
                    width: `${Math.max(
                      4,
                      ((thoughts.filter((t) => !t.tag).length) / Math.max(1, user.thoughtsTotal)) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.tagCount}>{thoughts.filter((t) => !t.tag).length}</Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.about}>
          <Text style={styles.aboutLogo}>murmur.</Text>
          <Text style={styles.aboutTagline}>be still. be honest.</Text>
          <Text style={styles.aboutCopy}>© 2026 · A quiet space for daily reflection.</Text>
        </View>

      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 60 },

  // Header
  header: {
    padding: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  rule: { width: 14, height: 1, backgroundColor: colors.accent },
  eyebrow: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  username: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 26,
    fontWeight: '300',
    color: colors.bright,
    marginBottom: 4,
  },
  editHint: {
    fontFamily: 'System',
    fontSize: 10,
    color: colors.muted,
  },
  nameEdit: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  nameInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtnText: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.white,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.accent,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCell: {
    width: '33.33%',
    padding: 18,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cellBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  cellBorderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statNum: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '300',
    color: colors.bright,
    lineHeight: 28,
    marginBottom: 3,
  },
  accentNum: { color: colors.accent },
  statLabel: {
    fontFamily: 'System',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },

  // Activity
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityCell: {
    width: 22,
    height: 22,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityDone: { backgroundColor: colors.border2, borderColor: colors.border2 },
  activityMid: { backgroundColor: '#9AB4C0', borderColor: '#9AB4C0' },
  activityHigh: { backgroundColor: colors.accent, borderColor: colors.accent },
  activityToday: { borderColor: colors.accentD, borderWidth: 2 },
  activityHint: {
    fontFamily: 'System',
    fontSize: 9,
    color: colors.muted,
    paddingHorizontal: 20,
    paddingBottom: 4,
    paddingTop: 6,
    fontStyle: 'italic',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Tag distribution
  tagList: {
    padding: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagLabel: {
    width: 72,
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  tagBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagBar: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  tagBarMuted: { backgroundColor: colors.border2 },
  tagCount: {
    width: 24,
    fontFamily: 'Georgia',
    fontSize: 12,
    color: colors.dim,
    textAlign: 'right',
  },

  // About
  about: {
    padding: 28,
    alignItems: 'center',
    gap: 4,
  },
  aboutLogo: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    fontWeight: '300',
    color: colors.muted,
  },
  aboutTagline: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.muted,
  },
  aboutCopy: {
    fontFamily: 'System',
    fontSize: 9,
    color: colors.border2,
    marginTop: 4,
  },
});
