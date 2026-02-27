import React, { useState, useRef, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Switch, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext';
import { themes, ThemeKey, ColorPalette } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';

const TOTAL_SLIDES = 5;
const { width: SCREEN_W } = Dimensions.get('window');
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function pad(n: number) { return n.toString().padStart(2, '0'); }
function formatTime(h: number, m: number) {
  const s = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${pad(m)} ${s}`;
}

interface Props {
  onComplete: (name: string) => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { themeKey, colors, setTheme } = useContext(ThemeContext);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('wanderer');
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { enableNotifications } = useNotifications();
  const [remindersOn, setRemindersOn] = useState(false);
  const [hour, setHour] = useState(21);
  const [minute, setMinute] = useState(0);

  function animateTo(next: number, dir: 'fwd' | 'back') {
    const outX = dir === 'fwd' ? -SCREEN_W : SCREEN_W;
    const inX = dir === 'fwd' ? SCREEN_W : -SCREEN_W;
    Animated.parallel([
      Animated.timing(translateX, { toValue: outX, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      translateX.setValue(inX);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }

  function goNext() { animateTo(step + 1, 'fwd'); }
  function goBack() { animateTo(step - 1, 'back'); }

  async function handleBegin() {
    if (remindersOn) {
      const ok = await enableNotifications(hour, minute);
      if (!ok) {
        Alert.alert('Permission needed', 'You can enable reminders later in Settings.', [{ text: 'OK' }]);
      }
    }
    onComplete(name.trim() || 'wanderer');
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right', 'bottom']}>

      {/* Back button */}
      <View style={styles.topBar}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: colors.muted }]}>← back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Slide content */}
      <Animated.View style={[styles.slideArea, { transform: [{ translateX }], opacity: fadeAnim }]}>
        {step === 0 && <SlideWelcome colors={colors} />}
        {step === 1 && <SlideHowItWorks colors={colors} />}
        {step === 2 && <SlideName colors={colors} name={name} onChangeName={setName} />}
        {step === 3 && <SlideTheme colors={colors} themeKey={themeKey} onSelect={setTheme} />}
        {step === 4 && (
          <SlideReminders
            colors={colors}
            enabled={remindersOn}
            onToggle={setRemindersOn}
            hour={hour}
            minute={minute}
            onHour={setHour}
            onMinute={setMinute}
          />
        )}
      </Animated.View>

      {/* Footer: dots + nav */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? colors.accent : colors.border2 },
                i === step && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.navRow}>
          <View style={{ flex: 1 }} />
          {step < TOTAL_SLIDES - 1 ? (
            <TouchableOpacity
              style={[styles.navBtn, { borderColor: colors.accent }]}
              onPress={goNext}
              activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: colors.accent }]}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
              onPress={handleBegin}
              activeOpacity={0.8}
            >
              <Text style={[styles.navBtnText, { color: colors.white }]}>Begin</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </SafeAreaView>
  );
}

// ─── Slide: Welcome ────────────────────────────────────────────────────────────

function SlideWelcome({ colors }: { colors: ColorPalette }) {
  return (
    <View style={slides.root}>
      <View style={slides.center}>
        <Text style={[slides.logo, { color: colors.bright }]}>
          murmur<Text style={{ color: colors.accent }}>.</Text>
        </Text>
        <Text style={[slides.tagline, { color: colors.dim }]}>be still. be honest.</Text>
        <View style={[slides.divider, { backgroundColor: colors.border2 }]} />
        <Text style={[slides.body, { color: colors.muted }]}>
          A quiet place to think, feel, and remember — one day at a time.
        </Text>
      </View>
    </View>
  );
}

// ─── Slide: How it works ───────────────────────────────────────────────────────

function SlideHowItWorks({ colors }: { colors: ColorPalette }) {
  const items: [string, string][] = [
    ['today', 'Write thoughts, log your mood, track habits, capture voice notes, and add a daily photo.'],
    ['logs', 'Browse past entries, photos, calendar events, and voice recordings.'],
    ['profile', 'Track your streak, view writing stats, and choose your theme and reminders.'],
  ];
  return (
    <View style={[slides.root, { justifyContent: 'center', gap: 38 }]}>
      <Text style={[slides.heading, { color: colors.bright, marginBottom: 28, marginTop: -8 }]}>how it works</Text>
      {items.map(([label, desc]) => (
        <View key={label} style={[slides.bulletRow, { borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[slides.bulletLabel, { color: colors.accent }]}>{label}</Text>
            <Text style={[slides.bulletDesc, { color: colors.text }]}>{desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Slide: Name ───────────────────────────────────────────────────────────────

function SlideName({
  colors, name, onChangeName,
}: { colors: ColorPalette; name: string; onChangeName: (v: string) => void }) {
  return (
    <View style={[slides.root, { justifyContent: 'center', gap: 12, marginTop: -32 }]}>
      <Text style={[slides.heading, { color: colors.bright }]}>what should we call you?</Text>
      <Text style={[slides.sub, { color: colors.muted, marginBottom: 16 }]}>You can always change this later.</Text>
      <TextInput
        style={[slides.nameInput, {
          borderColor: colors.border2,
          color: colors.text,
          backgroundColor: colors.surface,
        }]}
        value={name}
        onChangeText={onChangeName}
        autoCapitalize="none"
        returnKeyType="done"
        selectionColor={colors.accent}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

// ─── Slide: Theme ──────────────────────────────────────────────────────────────

function SlideTheme({
  colors, themeKey, onSelect,
}: { colors: ColorPalette; themeKey: ThemeKey; onSelect: (k: ThemeKey) => void }) {
  const keys = Object.keys(themes) as ThemeKey[];
  const rows = Array.from({ length: Math.ceil(keys.length / 2) }, (_, i) => keys.slice(i * 2, i * 2 + 2));
  return (
    <View style={slides.root}>
      <Text style={[slides.heading, { color: colors.bright }]}>choose a theme</Text>
      <Text style={[slides.sub, { color: colors.muted }]}>The preview updates live as you pick.</Text>
      <View style={slides.themeGrid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={slides.themeGridRow}>
            {row.map((key) => {
              const t = themes[key];
              const isActive = key === themeKey;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    slides.themeGridSwatch,
                    { backgroundColor: t.colors.bg, borderColor: isActive ? t.colors.accent : t.colors.border2 },
                    isActive && { borderWidth: 2 },
                  ]}
                  onPress={() => onSelect(key)}
                  activeOpacity={0.8}
                >
                  <View style={slides.swatchDots}>
                    <View style={[slides.swatchDot, { backgroundColor: t.colors.bg, borderWidth: 1, borderColor: t.colors.border }]} />
                    <View style={[slides.swatchDot, { backgroundColor: t.colors.surface2 }]} />
                    <View style={[slides.swatchDot, { backgroundColor: t.colors.accent }]} />
                    <View style={[slides.swatchDot, { backgroundColor: t.colors.bright }]} />
                  </View>
                  <Text style={[
                    slides.swatchLabel,
                    { color: isActive ? t.colors.accent : t.colors.dim },
                    isActive && { fontWeight: '600' },
                  ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Slide: Reminders ──────────────────────────────────────────────────────────

interface RemindersProps {
  colors: ColorPalette;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  hour: number;
  minute: number;
  onHour: (h: number) => void;
  onMinute: (m: number) => void;
}

function SlideReminders({ colors, enabled, onToggle, hour, minute, onHour, onMinute }: RemindersProps) {
  return (
    <View style={[slides.root, { justifyContent: 'center' }]}>
      <Text style={[slides.heading, { color: colors.bright }]}>daily reminder</Text>
      <Text style={[slides.sub, { color: colors.muted }]}>A gentle nudge to reflect each day.</Text>

      <View style={[slides.toggleRow, { borderColor: colors.border }]}>
        <Text style={[slides.toggleLabel, { color: colors.text }]}>Enable daily reminder</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border2, true: colors.accent }}
          thumbColor={colors.white}
        />
      </View>

      {enabled && (
        <View style={slides.timePicker}>
          <Text style={[slides.timeLabel, { color: colors.bright }]}>Hour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {HOURS.map((h) => (
              <TouchableOpacity
                key={h}
                style={[slides.chip, { borderColor: h === hour ? colors.accent : 'transparent' }]}
                onPress={() => onHour(h)}
                activeOpacity={0.7}
              >
                <Text style={[slides.chipText, { color: h === hour ? colors.accent : colors.dim }]}>
                  {pad(h)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[slides.timeLabel, { color: colors.bright }]}>Minute</Text>
          <View style={slides.minuteRow}>
            {MINUTES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[slides.chip, { borderColor: m === minute ? colors.accent : 'transparent' }]}
                onPress={() => onMinute(m)}
                activeOpacity={0.7}
              >
                <Text style={[slides.chipText, { color: m === minute ? colors.accent : colors.dim }]}>
                  :{pad(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[slides.timePreview, { color: colors.accent }]}>
            {formatTime(hour, minute)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { height: 48, justifyContent: 'center', paddingHorizontal: 20 },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontFamily: 'System', fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  slideArea: { flex: 1 },
  footer: { paddingHorizontal: 28, paddingBottom: 12 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotActive: { width: 18, borderRadius: 2.5 },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { borderWidth: 1, paddingHorizontal: 28, paddingVertical: 13 },
  navBtnText: { fontFamily: 'System', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
});

const slides = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 32, paddingTop: 20, paddingBottom: 8 },

  // Welcome
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontFamily: 'Georgia', fontStyle: 'italic', fontWeight: '300', fontSize: 52, letterSpacing: -1, marginBottom: 10 },
  tagline: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16, fontWeight: '300', marginBottom: 28 },
  divider: { width: 40, height: 1, marginBottom: 28 },
  body: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, fontWeight: '300', textAlign: 'center', lineHeight: 24 },

  // How it works / shared heading
  heading: { fontFamily: 'Georgia', fontStyle: 'italic', fontWeight: '300', fontSize: 28, letterSpacing: -0.3, marginBottom: 8 },
  sub: { fontFamily: 'System', fontSize: 12, marginBottom: 28, letterSpacing: 0.2 },

  // How it works
  bulletList: { gap: 24 },
  bulletRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  bulletRule: { width: 1, height: '100%', marginTop: 4 },
  bulletLabel: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  bulletDesc: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, fontWeight: '300', lineHeight: 20 },

  // Name
  nameInput: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    fontWeight: '300',
  },

  // Theme grid
  themeGrid: { flex: 1, gap: 6 },
  themeGridRow: { flex: 1, flexDirection: 'row', gap: 6 },
  themeGridSwatch: { flex: 1, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  swatchDots: { flexDirection: 'row', gap: 5 },
  swatchDot: { width: 16, height: 16, borderRadius: 8 },
  swatchLabel: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13, fontWeight: '300' },

  // Reminders
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  toggleLabel: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16, fontWeight: '300' },
  timePicker: { gap: 10 },
  timeLabel: { fontFamily: 'System', fontSize: 8, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  minuteRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, marginRight: 4 },
  chipText: { fontFamily: 'System', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timePreview: { fontFamily: 'Georgia', fontSize: 28, fontWeight: '300', letterSpacing: -0.5, marginTop: 6 },
});
