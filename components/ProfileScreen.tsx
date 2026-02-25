import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { themes, ThemeKey } from '../constants/theme';
import { UserStats } from '../hooks/useThoughts';
import { TAGS } from '../constants/data';

interface Props {
  user: UserStats;
  thoughts: Array<{ tag: string; timestamp: string }>;
  onUpdateUsername: (name: string) => void;
}

export default function ProfileScreen({ user, thoughts, onUpdateUsername }: Props) {
  const { themeKey, colors, setTheme } = useContext(ThemeContext);
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
    return acc + ((t as any).body?.split(/\s+/).length || 0);
  }, 0);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.ruleRow}>
            <View style={[styles.rule, { backgroundColor: colors.accent }]} />
            <Text style={[styles.eyebrow, { color: colors.muted }]}>Your profile</Text>
          </View>
          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput
                style={[styles.nameInput, { backgroundColor: colors.bg, borderColor: colors.accent, color: colors.text }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveName}>
                <Text style={[styles.saveBtnText, { color: colors.white }]}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7}>
              <Text style={[styles.username, { color: colors.bright }]}>{user.username}</Text>
              <Text style={[styles.editHint, { color: colors.muted }]}>Tap to edit name</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats grid */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Overview</Text>
        </View>
        <View style={[styles.statsGrid, { borderBottomColor: colors.border }]}>
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.accent }]}>{user.streak}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Day streak</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsToday}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Today</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsTotal}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total entries</Text>
          </View>
          <View style={[styles.statCell, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>{totalWords}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Words written</Text>
          </View>
          <View style={[styles.statCell, { borderTopWidth: 1, borderTopColor: colors.border, borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>
              {new Set(thoughts.map((t) => t.tag).filter(Boolean)).size}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Tags used</Text>
          </View>
          <View style={[styles.statCell, { borderTopWidth: 1, borderTopColor: colors.border, borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>
              {thoughts.length > 0 ? Math.round(totalWords / thoughts.length) : 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg. words</Text>
          </View>
        </View>

        {/* Activity grid */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Last 30 days</Text>
        </View>
        <View style={[styles.activityGrid, { borderBottomColor: colors.border }]}>
          {days.map((d, i) => {
            const isToday = d.date.toDateString() === new Date().toDateString();
            let cellColor = colors.surface2;
            if (d.count >= 4) cellColor = colors.accent;
            else if (d.count >= 2) cellColor = colors.accentL;
            else if (d.count >= 1) cellColor = colors.border2;

            return (
              <View
                key={i}
                style={[
                  styles.activityCell,
                  { backgroundColor: cellColor, borderColor: isToday ? colors.accentD : colors.border },
                  isToday && { borderWidth: 2 },
                ]}
              />
            );
          })}
        </View>
        <Text style={[styles.activityHint, { color: colors.muted, borderBottomColor: colors.border }]}>
          Each cell = one day · shade = entries written
        </Text>

        {/* Tag distribution */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>By tag</Text>
        </View>
        <View style={[styles.tagList, { borderBottomColor: colors.border }]}>
          {tagCounts.map(({ tag, count }) => (
            <View key={tag} style={styles.tagRow}>
              <Text style={[styles.tagLabel, { color: colors.muted }]}>{tag}</Text>
              <View style={[styles.tagBarBg, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <View
                  style={[
                    styles.tagBar,
                    { backgroundColor: colors.accent },
                    { width: `${Math.max(4, (count / Math.max(1, user.thoughtsTotal)) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.tagCount, { color: colors.dim }]}>{count}</Text>
            </View>
          ))}
          <View style={styles.tagRow}>
            <Text style={[styles.tagLabel, { color: colors.muted }]}>untagged</Text>
            <View style={[styles.tagBarBg, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <View
                style={[
                  styles.tagBar,
                  { backgroundColor: colors.border2 },
                  {
                    width: `${Math.max(
                      4,
                      ((thoughts.filter((t) => !t.tag).length) / Math.max(1, user.thoughtsTotal)) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.tagCount, { color: colors.dim }]}>{thoughts.filter((t) => !t.tag).length}</Text>
          </View>
        </View>

        {/* Theme picker */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Appearance</Text>
        </View>
        <View style={[styles.themeGrid, { borderBottomColor: colors.border }]}>
          {(Object.keys(themes) as ThemeKey[]).map((key) => {
            const t = themes[key];
            const isActive = key === themeKey;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.themeCard,
                  { backgroundColor: t.colors.bg, borderColor: isActive ? t.colors.accent : t.colors.border },
                  isActive && styles.themeCardActive,
                ]}
                onPress={() => setTheme(key)}
                activeOpacity={0.8}
              >
                {/* Mini colour preview swatches */}
                <View style={styles.themeSwatches}>
                  <View style={[styles.swatch, { backgroundColor: t.colors.bg, borderColor: t.colors.border }]} />
                  <View style={[styles.swatch, { backgroundColor: t.colors.accent }]} />
                  <View style={[styles.swatch, { backgroundColor: t.colors.surface2, borderColor: t.colors.border }]} />
                </View>
                <Text style={[
                  styles.themeLabel,
                  { color: isActive ? t.colors.accent : t.colors.muted },
                ]}>
                  {t.label}
                </Text>
                <View style={[styles.themeActiveDot, { backgroundColor: t.colors.accent, opacity: isActive ? 1 : 0 }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* About */}
        <View style={styles.about}>
          <Text style={[styles.aboutLogo, { color: colors.muted }]}>murmur.</Text>
          <Text style={[styles.aboutTagline, { color: colors.muted }]}>be still. be honest.</Text>
          <Text style={[styles.aboutCopy, { color: colors.border2 }]}>© 2026 · A quiet space for daily reflection.</Text>
        </View>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 60 },

  header: { padding: 28, borderBottomWidth: 1 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  rule: { width: 14, height: 1 },
  eyebrow: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' },
  username: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 26, fontWeight: '300', marginBottom: 4 },
  editHint: { fontFamily: 'System', fontSize: 10 },
  nameEdit: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  nameInput: {
    flex: 1, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 18,
  },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  saveBtnText: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12, borderBottomWidth: 1 },
  sectionTitle: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1 },
  statCell: { width: '33.33%', padding: 18 },
  statNum: { fontFamily: 'Georgia', fontSize: 24, fontWeight: '300', lineHeight: 28, marginBottom: 3 },
  statLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },

  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 20, borderBottomWidth: 1 },
  activityCell: { width: 22, height: 22, borderWidth: 1 },
  activityHint: { fontFamily: 'System', fontSize: 9, paddingHorizontal: 20, paddingBottom: 4, paddingTop: 6, fontStyle: 'italic', borderBottomWidth: 1 },

  tagList: { padding: 20, gap: 12, borderBottomWidth: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagLabel: { width: 72, fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  tagBarBg: { flex: 1, height: 6, borderWidth: 1 },
  tagBar: { height: '100%' },
  tagCount: { width: 24, fontFamily: 'Georgia', fontSize: 12, textAlign: 'right' },

  // Theme picker
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 20,
    borderBottomWidth: 1,
  },
  themeCard: {
    width: '30%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  themeCardActive: {
    // no size change — just border color handled inline
  },
  themeSwatches: {
    flexDirection: 'row',
    gap: 3,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  themeLabel: {
    fontFamily: 'System',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  themeActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  about: { padding: 28, alignItems: 'center', gap: 4 },
  aboutLogo: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 18, fontWeight: '300' },
  aboutTagline: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 12 },
  aboutCopy: { fontFamily: 'System', fontSize: 9, marginTop: 4 },
});