import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Switch, Alert, Modal,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { themes, ThemeKey } from '../constants/theme';
import { UserStats } from '../hooks/useThoughts';
import { TAGS } from '../constants/data';
import { useNotifications } from '../hooks/useNotifications';

interface Props {
  user: UserStats;
  thoughts: Array<{ tag: string; timestamp: string }>;
  onUpdateUsername: (name: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function pad(n: number) { return n.toString().padStart(2, '0'); }
function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${pad(minute)} ${suffix}`;
}

export default function ProfileScreen({ user, thoughts, onUpdateUsername }: Props) {
  const { themeKey, colors, setTheme } = useContext(ThemeContext);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.username);
  const [editingTime, setEditingTime] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    settings: notifSettings,
    loading: notifLoading,
    enableNotifications,
    disableNotifications,
    updateTime,
  } = useNotifications();

  const [pendingHour, setPendingHour] = useState(notifSettings.hour);
  const [pendingMinute, setPendingMinute] = useState(notifSettings.minute);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    setPendingHour(notifSettings.hour);
    setPendingMinute(notifSettings.minute);
  }, [notifSettings.hour, notifSettings.minute]);

  function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onUpdateUsername(trimmed);
    setEditingName(false);
  }

  async function handleToggleNotifications(value: boolean) {
    if (value) {
      const success = await enableNotifications(notifSettings.hour, notifSettings.minute);
      if (!success) {
        Alert.alert('Permission needed', 'Allow murmur to send notifications in your device settings.', [{ text: 'OK' }]);
      }
    } else {
      await disableNotifications();
    }
  }

  async function handleSaveTime() {
    await updateTime(pendingHour, pendingMinute);
    setEditingTime(false);
  }

  const tagCounts = TAGS.map((tag) => ({
    tag,
    count: thoughts.filter((t) => t.tag === tag).length,
  })).sort((a, b) => b.count - a.count);

  const now = Date.now();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * 86400000);
    const dateStr = d.toDateString();
    const count = thoughts.filter((t) => new Date(t.timestamp).toDateString() === dateStr).length;
    return { date: d, count };
  });

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
        <View style={[styles.header, { borderBottomColor: colors.bright }]}>
          <View style={styles.ruleRow}>
            <View style={[styles.rule, { backgroundColor: colors.accent }]} />
            <Text style={[styles.eyebrow, { color: colors.bright }]}>Your profile</Text>
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
              <Text style={[styles.editHint, { color: colors.bright }]}>Tap to edit name</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats grid */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.bright }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Overview</Text>
        </View>
        <View style={[styles.statsGrid, { borderBottomColor: colors.bright }]}>
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.accent }]}>{user.streak}</Text>
            <Text style={[styles.statLabel, { color: colors.bright }]}>Day streak</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: 1, borderLeftColor: colors.bright }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsToday}</Text>
            <Text style={[styles.statLabel, { color: colors.bright }]}>Today</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: 1, borderLeftColor: colors.bright }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsTotal}</Text>
            <Text style={[styles.statLabel, { color: colors.bright }]}>Total entries</Text>
          </View>
          <View style={[styles.statCell, { borderTopWidth: 1, borderTopColor: colors.bright }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>{totalWords}</Text>
            <Text style={[styles.statLabel, { color: colors.bright }]}>Words written</Text>
          </View>
          <View style={[styles.statCell, { borderTopWidth: 1, borderTopColor: colors.bright, borderLeftWidth: 1, borderLeftColor: colors.bright }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>
              {new Set(thoughts.map((t) => t.tag).filter(Boolean)).size}
            </Text>
            <Text style={[styles.statLabel, { color: colors.bright }]}>Tags used</Text>
          </View>
          <View style={[styles.statCell, { borderTopWidth: 1, borderTopColor: colors.bright, borderLeftWidth: 1, borderLeftColor: colors.bright }]}>
            <Text style={[styles.statNum, { color: colors.bright }]}>
              {thoughts.length > 0 ? Math.round(totalWords / thoughts.length) : 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.bright }]}>Avg. words</Text>
          </View>
        </View>

        {/* Activity grid */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.bright }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Last 30 days</Text>
        </View>
        <View style={[styles.activityGrid, { borderBottomColor: colors.bright }]}>
          {Array.from({ length: 3 }).map((_, rowIdx) => (
            <View key={rowIdx} style={styles.activityRow}>
              {days.slice(rowIdx * 10, rowIdx * 10 + 10).map((d, colIdx) => {
                const isToday = d.date.toDateString() === new Date().toDateString();
                let cellColor = colors.surface2;
                if (d.count >= 4) cellColor = colors.accent;
                else if (d.count >= 2) cellColor = colors.accentL;
                else if (d.count >= 1) cellColor = colors.border2;
                return (
                  <View
                    key={colIdx}
                    style={[
                      styles.activityCell,
                      { backgroundColor: cellColor, borderColor: isToday ? colors.accent : colors.bright },
                      isToday && { borderWidth: 2 },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
        <Text style={[styles.activityHint, { color: colors.bright, borderBottomColor: colors.bright }]}>
          Each cell = one day · shade = entries written
        </Text>

        {/* Tag distribution */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.bright }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>By tag</Text>
        </View>
        <View style={[styles.tagList, { borderBottomColor: colors.bright }]}>
          {tagCounts.map(({ tag, count }) => (
            <View key={tag} style={styles.tagRow}>
              <Text style={[styles.tagLabel, { color: colors.bright }]}>{tag}</Text>
              <View style={[styles.tagBarBg, { backgroundColor: colors.surface2, borderColor: 'transparent' }]}>
                <View style={[styles.tagBar, { backgroundColor: colors.accent, width: `${Math.max(4, (count / Math.max(1, user.thoughtsTotal)) * 100)}%` }]} />
              </View>
              <Text style={[styles.tagCount, { color: colors.bright }]}>{count}</Text>
            </View>
          ))}
          <View style={styles.tagRow}>
            <Text style={[styles.tagLabel, { color: colors.bright }]}>untagged</Text>
            <View style={[styles.tagBarBg, { backgroundColor: colors.surface2, borderColor: 'transparent' }]}>
              <View style={[styles.tagBar, { backgroundColor: colors.bright, width: `${Math.max(4, (thoughts.filter((t) => !t.tag).length / Math.max(1, user.thoughtsTotal)) * 100)}%` }]} />
            </View>
            <Text style={[styles.tagCount, { color: colors.bright }]}>{thoughts.filter((t) => !t.tag).length}</Text>
          </View>
        </View>

        {/* Reminders */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.bright }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Reminders</Text>
        </View>
        <View style={[styles.reminderSection, { borderBottomColor: colors.bright }]}>
          <View style={styles.reminderRow}>
            <View style={styles.reminderLeft}>
              <Text style={[styles.reminderLabel, { color: colors.bright }]}>Daily reminder</Text>
              <Text style={[styles.reminderSub, { color: colors.bright }]}>
                {notifSettings.enabled
                  ? `Repeats at ${formatTime(notifSettings.hour, notifSettings.minute)}`
                  : 'Off'}
              </Text>
            </View>
            <Switch
              value={notifSettings.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.bright, true: colors.accent }}
              thumbColor={colors.white}
              disabled={notifLoading}
            />
          </View>

          {notifSettings.enabled && (
            <>
              <View style={[styles.reminderDivider, { backgroundColor: colors.bright }]} />
              {editingTime ? (
                <View style={styles.timePicker}>
                  <Text style={[styles.timePickerLabel, { color: colors.bright }]}>Hour</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.timeChip,
                          { borderColor: 'transparent' },
                          pendingHour === h && { borderColor: colors.accent },
                        ]}
                        onPress={() => setPendingHour(h)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timeChipText, { color: pendingHour === h ? colors.accent : colors.bright }]}>
                          {pad(h)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={[styles.timePickerLabel, { color: colors.bright }]}>Minute</Text>
                  <View style={styles.minuteRow}>
                    {MINUTES.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.timeChip,
                          { borderColor: 'transparent' },
                          pendingMinute === m && { borderColor: colors.accent },
                        ]}
                        onPress={() => setPendingMinute(m)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timeChipText, { color: pendingMinute === m ? colors.accent : colors.bright }]}>
                          :{pad(m)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.timeActions}>
                    <TouchableOpacity onPress={() => setEditingTime(false)} activeOpacity={0.7}>
                      <Text style={[styles.timeCancelText, { color: colors.bright }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.timeSaveBtn, { backgroundColor: colors.accent }]}
                      onPress={handleSaveTime}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.timeSaveBtnText, { color: colors.white }]}>
                        Set {formatTime(pendingHour, pendingMinute)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.timeDisplay} onPress={() => setEditingTime(true)} activeOpacity={0.7}>
                  <Text style={[styles.timeDisplayValue, { color: colors.bright }]}>
                    {formatTime(notifSettings.hour, notifSettings.minute)}
                  </Text>
                  <Text style={[styles.timeDisplayHint, { color: colors.bright }]}>Tap to change time</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Appearance */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.bright }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Appearance</Text>
        </View>
        <View style={[styles.appearanceRow, { borderBottomColor: colors.bright }]}>
          <View style={styles.appearanceLeft}>
            <Text style={[styles.appearanceLabel, { color: colors.bright }]}>Theme</Text>
            <Text style={[styles.appearanceSub, { color: colors.bright }]}>{themes[themeKey].label}</Text>
          </View>
          <TouchableOpacity
            style={[styles.changeThemeBtn, { borderColor: colors.accent }]}
            onPress={() => setThemeModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.changeThemeBtnText, { color: colors.accent }]}>Change theme</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.about}>
          <Text style={[styles.aboutLogo, { color: colors.bright }]}>murmur.</Text>
          <Text style={[styles.aboutTagline, { color: colors.bright }]}>be still. be honest.</Text>
          <Text style={[styles.aboutCopy, { color: colors.bright }]}>© 2026 · A quiet space for daily reflection.</Text>
        </View>

      </Animated.View>

      {/* Theme picker modal */}
      <Modal
        visible={themeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <ScrollView
          style={[styles.themeModal, { backgroundColor: colors.bg }]}
          contentContainerStyle={styles.themeModalContent}
        >
          <View style={[styles.themeModalHeader, { borderBottomColor: colors.bright }]}>
            <Text style={[styles.themeModalTitle, { color: colors.bright }]}>
              Choose a <Text style={[styles.themeModalTitleEm, { color: colors.accent }]}>theme</Text>
            </Text>
            <TouchableOpacity onPress={() => setThemeModalVisible(false)} activeOpacity={0.7}>
              <Text style={[styles.themeModalClose, { color: colors.bright }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {(Object.keys(themes) as ThemeKey[]).map((key) => {
            const t = themes[key];
            const isActive = key === themeKey;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.themeRow,
                  { backgroundColor: t.colors.bg, borderBottomColor: t.colors.bright },
                  isActive && { borderLeftWidth: 3, borderLeftColor: t.colors.accent },
                ]}
                onPress={() => { setTheme(key); setThemeModalVisible(false); }}
                activeOpacity={0.85}
              >
                <View style={styles.themeRowSwatches}>
                  <View style={[styles.themeRowSwatch, { backgroundColor: t.colors.bg, borderColor: t.colors.bright, borderWidth: 1 }]} />
                  <View style={[styles.themeRowSwatch, { backgroundColor: t.colors.surface2 }]} />
                  <View style={[styles.themeRowSwatch, { backgroundColor: t.colors.accent }]} />
                  <View style={[styles.themeRowSwatch, { backgroundColor: t.colors.bright }]} />
                </View>
                <View style={styles.themeRowInfo}>
                  <Text style={[styles.themeRowName, { color: isActive ? t.colors.accent : t.colors.bright }]}>
                    {t.label}
                  </Text>
                  {isActive && (
                    <Text style={[styles.themeRowCurrent, { color: t.colors.accent }]}>Current</Text>
                  )}
                </View>
                <View style={[styles.themeRowRadio, { borderColor: isActive ? t.colors.accent : t.colors.bright }]}>
                  {isActive && <View style={[styles.themeRowRadioInner, { backgroundColor: t.colors.accent }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Modal>

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
  nameInput: { flex: 1, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 18 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  saveBtnText: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12, borderBottomWidth: 1 },
  sectionTitle: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1 },
  statCell: { width: '33.33%', padding: 18 },
  statNum: { fontFamily: 'Georgia', fontSize: 24, fontWeight: '300', lineHeight: 28, marginBottom: 3 },
  statLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },

  activityGrid: { paddingHorizontal: 20, paddingVertical: 16, gap: 4, borderBottomWidth: 1 },
  activityRow: { flexDirection: 'row', gap: 4 },
  activityCell: { flex: 1, aspectRatio: 1, borderWidth: 1 },
  activityHint: { fontFamily: 'System', fontSize: 9, paddingHorizontal: 20, paddingBottom: 4, paddingTop: 6, fontStyle: 'italic', borderBottomWidth: 1 },

  tagList: { padding: 20, gap: 12, borderBottomWidth: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagLabel: { width: 72, fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  tagBarBg: { flex: 1, height: 6, borderWidth: 1 },
  tagBar: { height: '100%' },
  tagCount: { width: 24, fontFamily: 'Georgia', fontSize: 12, textAlign: 'right' },

  reminderSection: { borderBottomWidth: 1 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  reminderLeft: { flex: 1 },
  reminderLabel: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16, fontWeight: '300', marginBottom: 3 },
  reminderSub: { fontFamily: 'System', fontSize: 9, letterSpacing: 0.5 },
  reminderDivider: { height: 1, marginHorizontal: 20 },
  timeDisplay: { padding: 20 },
  timeDisplayValue: { fontFamily: 'Georgia', fontSize: 32, fontWeight: '300', letterSpacing: -0.5, marginBottom: 4 },
  timeDisplayHint: { fontFamily: 'System', fontSize: 9, fontStyle: 'italic' },
  timePicker: { padding: 20, gap: 10 },
  timePickerLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  timeScroll: { flexGrow: 0 },
  minuteRow: { flexDirection: 'row', gap: 8 },
  timeChip: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, marginRight: 6 },
  timeChipText: { fontFamily: 'System', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  timeCancelText: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },
  timeSaveBtn: { paddingHorizontal: 18, paddingVertical: 10 },
  timeSaveBtnText: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  appearanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  appearanceLeft: { flex: 1 },
  appearanceLabel: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16, fontWeight: '300', marginBottom: 3 },
  appearanceSub: { fontFamily: 'System', fontSize: 9, letterSpacing: 0.5 },
  changeThemeBtn: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  changeThemeBtnText: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  themeModal: { flex: 1 },
  themeModalContent: { paddingBottom: 60 },
  themeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 28, borderBottomWidth: 1 },
  themeModalTitle: { fontFamily: 'Georgia', fontSize: 26, fontWeight: '300', letterSpacing: -0.3 },
  themeModalTitleEm: { fontStyle: 'italic' },
  themeModalClose: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20, paddingHorizontal: 24, borderBottomWidth: 1, borderLeftWidth: 0 },
  themeRowSwatches: { flexDirection: 'row', gap: 4 },
  themeRowSwatch: { width: 20, height: 20, borderRadius: 10 },
  themeRowInfo: { flex: 1 },
  themeRowName: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 18, fontWeight: '300', marginBottom: 2 },
  themeRowCurrent: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  themeRowRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  themeRowRadioInner: { width: 9, height: 9, borderRadius: 4.5 },

  about: { padding: 28, alignItems: 'center', gap: 4 },
  aboutLogo: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 18, fontWeight: '300' },
  aboutTagline: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 12 },
  aboutCopy: { fontFamily: 'System', fontSize: 9, marginTop: 4 },
});