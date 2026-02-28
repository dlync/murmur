import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Switch, Alert, Modal,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { themes, ThemeKey } from '../constants/theme';
import { Thought, UserStats } from '../hooks/useThoughts';
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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>

      {/* Header banner */}
      <View style={[styles.headerBanner, { backgroundColor: colors.accent }]}>
        <Text style={[styles.headerEyebrow, { color: colors.white }]}>Your profile</Text>
        <View style={styles.headerRow}>
          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput
                style={[styles.nameInput, { borderColor: colors.white, color: colors.white }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
                placeholderTextColor={colors.white}
              />
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={saveName}
              >
                <Text style={[styles.saveBtnText, { color: colors.white }]}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7} style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.white }]}>{user.username}</Text>
              <Text style={[styles.editHint, { color: colors.white }]}>Tap to edit name</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Stats grid */}
          <View style={[styles.statsGrid, { borderColor: colors.border }]}>
            <View style={[styles.statCell, { borderRightWidth: 2, borderRightColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.accent }]}>{user.streak}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Streak</Text>
            </View>
            <View style={[styles.statCell, { borderRightWidth: 2, borderRightColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsToday}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Today</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.bright }]}>{user.thoughtsTotal}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
            </View>
            <View style={[styles.statCell, { borderTopWidth: 2, borderTopColor: colors.border, borderRightWidth: 2, borderRightColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.bright }]}>{totalWords}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Words</Text>
            </View>
            <View style={[styles.statCell, { borderTopWidth: 2, borderTopColor: colors.border, borderRightWidth: 2, borderRightColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.bright }]}>
                {thoughts.reduce((max, t) => Math.max(max, (t as any).body?.split(/\s+/).filter(Boolean).length || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Longest</Text>
            </View>
            <View style={[styles.statCell, { borderTopWidth: 2, borderTopColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.bright }]}>
                {thoughts.length > 0 ? Math.round(totalWords / thoughts.length) : 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Avg.</Text>
            </View>
          </View>

          {/* Activity grid */}
          <Text style={[styles.sectionLabel, { color: colors.bright }]}>
            Last 30 <Text style={[styles.sectionLabelEm, { color: colors.accent }]}>days</Text>
          </Text>
          <View style={styles.activityGrid}>
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
                        { backgroundColor: cellColor },
                        isToday && { borderWidth: 2, borderColor: colors.accent },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          <Text style={[styles.activityHint, { color: colors.muted }]}>
            Each cell = one day · shade = entries written
          </Text>

          {/* Reminders */}
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.reminderRow}>
              <View style={styles.reminderLeft}>
                <Text style={[styles.reminderTime, { color: colors.accent }]}>
                  {formatTime(notifSettings.hour, notifSettings.minute)}
                </Text>
                <Text style={[styles.reminderLabel, { color: colors.muted }]}>
                  Daily reminder · {notifSettings.enabled ? 'on' : 'off'}
                </Text>
              </View>
              <Switch
                value={notifSettings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.surface2, true: colors.accent }}
                thumbColor={colors.white}
                disabled={notifLoading}
              />
            </View>

            {notifSettings.enabled && (
              <>
                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
                {editingTime ? (
                  <View style={styles.timePicker}>
                    <Text style={[styles.timePickerLabel, { color: colors.muted }]}>Hour</Text>
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
                    <Text style={[styles.timePickerLabel, { color: colors.muted }]}>Minute</Text>
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
                    <Text style={[styles.timeDisplayHint, { color: colors.muted }]}>Tap to change time</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Theme */}
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.themeCardRow}>
              <View style={styles.themeCardLeft}>
                <Text style={[styles.themeCardLbl, { color: colors.muted }]}>Theme</Text>
                <Text style={[styles.themeCardName, { color: colors.bright, fontSize: 18 }]}>{themes[themeKey].label}</Text>
              </View>
              <View style={styles.themeSwatches}>
                {[colors.bg, colors.surface2, colors.accent, colors.bright].map((c, i) => (
                  <View key={i} style={[styles.themeSwatch, { backgroundColor: c, borderColor: colors.border }]} />
                ))}
              </View>
            </View>
            <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.changeThemeBtn}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.changeThemeBtnText, { color: colors.accent }]}>Change theme →</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.about}>
            <Text style={[styles.aboutLogo, { color: colors.bright }]}>murmur.</Text>
            <Text style={[styles.aboutTagline, { color: colors.muted }]}>be still. be honest.</Text>
            <Text style={[styles.aboutCopy, { color: colors.muted }]}>© 2026 · A quiet space for daily reflection.</Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Theme picker modal */}
      <Modal
        visible={themeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={[styles.themeModal, { backgroundColor: colors.bg }]}>
          {/* Banner header */}
          <View style={[styles.themeModalBanner, { backgroundColor: colors.accent }]}>
            <Text style={[styles.themeModalEyebrow, { color: colors.white }]}>Appearance</Text>
            <View style={styles.themeModalBannerRow}>
              <Text style={[styles.themeModalTitle, { color: colors.white }]}>
                Choose a <Text style={styles.themeModalTitleEm}>theme</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setThemeModalVisible(false)}
                activeOpacity={0.7}
                style={[styles.themeModalCloseBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              >
                <Text style={[styles.themeModalClose, { color: colors.white }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme grid */}
          <ScrollView contentContainerStyle={styles.themeModalContent}>
            <View style={styles.themeGrid}>
              {(Object.keys(themes) as ThemeKey[]).map((key) => {
                const t = themes[key];
                const isActive = key === themeKey;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.themeCard,
                      { backgroundColor: isActive ? t.colors.accent : t.colors.border },
                    ]}
                    onPress={() => { setTheme(key); setThemeModalVisible(false); }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.themeCardInner, { backgroundColor: t.colors.bg }]}>
                      {/* Mini header strip */}
                      <View style={[styles.themeCardStrip, { backgroundColor: t.colors.accent }]}>
                        {isActive && (
                          <View style={[styles.themeActivePill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                            <Text style={[styles.themeActivePillText, { color: t.colors.white }]}>✓ Active</Text>
                          </View>
                        )}
                        {/* Mini mock lines */}
                        <View style={styles.themeStripLines}>
                          <View style={[styles.themeStripLine, { backgroundColor: 'rgba(255,255,255,0.5)', width: '55%' }]} />
                          <View style={[styles.themeStripLine, { backgroundColor: 'rgba(255,255,255,0.3)', width: '35%' }]} />
                        </View>
                      </View>

                      {/* Card body */}
                      <View style={[styles.themeCardBody, { backgroundColor: t.colors.surface }]}>
                        {/* Mock content lines */}
                        <View style={[styles.themeBodyLine, { backgroundColor: t.colors.border2, width: '80%' }]} />
                        <View style={[styles.themeBodyLine, { backgroundColor: t.colors.border, width: '55%', marginTop: 4 }]} />
                      </View>

                      {/* Footer: name + swatches */}
                      <View style={[styles.themeCardFooter, { backgroundColor: t.colors.bg }]}>
                        <Text style={[styles.themeCardName, { color: t.colors.bright }]}>{t.label}</Text>
                        <View style={styles.themeCardSwatches}>
                          {[t.colors.bg, t.colors.surface2, t.colors.accent, t.colors.bright].map((c, i) => (
                            <View key={i} style={[styles.themeCardSwatch, { backgroundColor: c, borderColor: t.colors.border }]} />
                          ))}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 60 },

  // Header banner
  headerBanner: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28, borderBottomLeftRadius: 30, borderBottomRightRadius: 30},
  headerEyebrow: {
    fontFamily: 'DMSans_700Bold', fontSize: 9,
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 18,
  },
  headerTitle: { fontFamily: 'Fraunces_900Black', fontSize: 32, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 30 },
  headerTitleEm: { fontFamily: 'Fraunces_900Black_Italic', textTransform: 'none' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  username: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 30, lineHeight: 34, marginBottom: 2 },
  editHint: { fontFamily: 'DMSans_400Regular', fontSize: 9 },
  nameEdit: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  nameInput: { flex: 1, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontFamily: 'Fraunces_300Light_Italic', fontSize: 18, borderRadius: 8 },
  saveBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 2, marginHorizontal: 18, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  statCell: { width: '33.33%', paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center' },
  statNum: { fontFamily: 'Fraunces_900Black', fontSize: 32, lineHeight: 38, marginBottom: 4 },
  statLabel: { fontFamily: 'DMSans_700Bold', fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  // Section labels
  sectionLabel: {
    fontFamily: 'Fraunces_900Black', fontSize: 13,
    textTransform: 'uppercase', letterSpacing: 0.3,
    marginHorizontal: 18, marginTop: 20, marginBottom: 10,
  },
  sectionLabelEm: { fontFamily: 'Fraunces_300Light_Italic', textTransform: 'none' },

  // Activity grid
  activityGrid: { paddingHorizontal: 18, gap: 4 },
  activityRow: { flexDirection: 'row', gap: 4 },
  activityCell: { flex: 1, aspectRatio: 1, borderRadius: 4 },
  activityHint: {
    fontFamily: 'DMSans_400Regular', fontSize: 9, paddingHorizontal: 18,
    paddingBottom: 4, paddingTop: 6,
  },

  // Setting cards (reminders, theme)
  settingCard: {
    marginHorizontal: 18, marginTop: 16,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  cardDivider: { height: 1 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  reminderLeft: { flex: 1 },
  reminderTime: { fontFamily: 'Fraunces_900Black', fontSize: 26, lineHeight: 30, marginBottom: 3 },
  reminderLabel: { fontFamily: 'DMSans_700Bold', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' },
  timeDisplay: { padding: 16 },
  timeDisplayHint: { fontFamily: 'DMSans_400Regular', fontSize: 9 },
  timePicker: { padding: 16, gap: 10 },
  timePickerLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase' },
  timeScroll: { flexGrow: 0 },
  minuteRow: { flexDirection: 'row', gap: 8 },
  timeChip: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, marginRight: 6, borderRadius: 6 },
  timeChipText: { fontFamily: 'DMSans_400Regular', fontSize: 11, letterSpacing: 0.5 },
  timeActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  timeCancelText: { fontFamily: 'DMSans_400Regular', fontSize: 10 },
  timeSaveBtn: { borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10 },
  timeSaveBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },

  // Theme card
  themeCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  themeCardLeft: {},
  themeCardLbl: { fontFamily: 'DMSans_700Bold', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  themeSwatches: { flexDirection: 'row', gap: 5 },
  themeSwatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  changeThemeBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  changeThemeBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },

  about: { padding: 28, alignItems: 'center', gap: 4, marginTop: 8 },
  aboutLogo: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 18 },
  aboutTagline: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 12 },
  aboutCopy: { fontFamily: 'DMSans_400Regular', fontSize: 9, marginTop: 4 },

  // Theme picker modal
  themeModal: { flex: 1 },
  themeModalBanner: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20 },
  themeModalEyebrow: {
    fontFamily: 'DMSans_700Bold', fontSize: 9,
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 8,
  },
  themeModalBannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeModalTitle: { fontFamily: 'Fraunces_900Black', fontSize: 22, textTransform: 'uppercase' },
  themeModalTitleEm: { fontFamily: 'Fraunces_300Light_Italic', textTransform: 'none' },
  themeModalCloseBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  themeModalClose: { fontFamily: 'DMSans_700Bold', fontSize: 13 },
  themeModalContent: { padding: 16, paddingBottom: 60 },

  // Theme card grid
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCard: { width: '47%', borderRadius: 16, padding: 2 },
  themeCardInner: { borderRadius: 14, overflow: 'hidden' },
  themeCardStrip: { height: 52, padding: 10, justifyContent: 'space-between' },
  themeActivePill: { borderRadius: 50, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  themeActivePillText: { fontFamily: 'DMSans_700Bold', fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase' },
  themeStripLines: { gap: 4 },
  themeStripLine: { height: 3, borderRadius: 2 },
  themeCardBody: { height: 36, paddingHorizontal: 10, paddingVertical: 8 },
  themeBodyLine: { height: 3, borderRadius: 2 },
  themeCardFooter: { padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeCardName: { fontFamily: 'Fraunces_300Light_Italic', fontSize: 13 },
  themeCardSwatches: { flexDirection: 'row', gap: 3 },
  themeCardSwatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
});
