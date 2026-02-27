import React, { useState, useRef, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { ThemeContext } from '../context/ThemeContext';
import { VoiceNote } from '../hooks/useVoiceNotes';

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Playback row (used in both Dashboard and Archive) ──────────────────────
interface PlaybackProps {
  note: VoiceNote;
  onDelete?: () => void;
}

export function VoiceNotePlayback({ note, onDelete }: PlaybackProps) {
  const { colors } = useContext(ThemeContext);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);

  async function toggle() {
    if (playing) {
      await sound?.pauseAsync();
      setPlaying(false);
    } else {
      if (sound) {
        await sound.replayAsync();
        setPlaying(true);
      } else {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound: s } = await Audio.Sound.createAsync(
          { uri: note.uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPositionMs(status.positionMillis ?? 0);
              if (status.didJustFinish) {
                setPlaying(false);
                setPositionMs(0);
              }
            }
          }
        );
        setSound(s);
        setPlaying(true);
      }
    }
  }

  async function handleDelete() {
    await sound?.unloadAsync();
    setSound(null);
    setPlaying(false);
    onDelete?.();
  }

  const progress = note.durationMs > 0 ? positionMs / note.durationMs : 0;
  const timeLabel = playing ? formatMs(positionMs) : formatMs(note.durationMs);
  const createdAt = new Date(note.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.playbackRow, { backgroundColor: colors.surface }]}>
      <TouchableOpacity onPress={toggle} style={[styles.playBtn, { borderColor: colors.accent }]} activeOpacity={0.7}>
        <Text style={[styles.playBtnIcon, { color: colors.accent }]}>{playing ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      <View style={styles.playbackMid}>
        <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.playbackMeta}>
          <Text style={[styles.playbackTime, { color: colors.bright }]}>{timeLabel}</Text>
          <Text style={[styles.playbackCreated, { color: colors.bright }]}>{createdAt}</Text>
        </View>
      </View>

      {onDelete && (
        <TouchableOpacity onPress={() => Alert.alert('Delete voice note', 'Remove this recording?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: handleDelete },
        ])} activeOpacity={0.7}>
          <Text style={[styles.deleteBtn, { color: colors.bright }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Recorder (Dashboard only) ──────────────────────────────────────────────
interface RecorderProps {
  onSave: (uri: string, durationMs: number) => Promise<void>;
}

export function VoiceNoteRecorder({ onSave }: RecorderProps) {
  const { colors } = useContext(ThemeContext);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingMs, setRecordingMs] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'saving'>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Allow murmur to access your microphone to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setPhase('recording');
      setRecordingMs(0);
      intervalRef.current = setInterval(() => setRecordingMs(ms => ms + 1000), 1000);
    } catch {
      Alert.alert('Error', 'Could not start recording.');
    }
  }

  async function stopAndSave() {
    if (!recording) return;
    setPhase('saving');
    if (intervalRef.current) clearInterval(intervalRef.current);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    const tempUri = recording.getURI();
    const status = await recording.getStatusAsync();
    const durationMs = status.isRecorded ? (status.durationMillis ?? recordingMs) : recordingMs;
    setRecording(null);
    setRecordingMs(0);
    if (tempUri && documentDirectory) {
      const dest = `${documentDirectory}voice_${Date.now()}.m4a`;
      await copyAsync({ from: tempUri, to: dest });
      await onSave(dest, durationMs);
    }
    setPhase('idle');
  }

  async function cancel() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await recording?.stopAndUnloadAsync();
    setRecording(null);
    setRecordingMs(0);
    setPhase('idle');
  }

  if (phase === 'idle') {
    return (
      <TouchableOpacity
        style={[styles.recordStartBtn, { borderColor: colors.bright }]}
        onPress={startRecording}
        activeOpacity={0.7}
      >
        <View style={[styles.micDot, { backgroundColor: colors.accent }]} />
        <Text style={[styles.recordStartText, { color: colors.bright }]}>Record a voice note</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.recordingActive, { backgroundColor: colors.surface }]}>
      <View style={styles.recordingLeft}>
        <View style={[styles.recDot, { backgroundColor: colors.accent }]} />
        <Text style={[styles.recordingTimer, { color: colors.bright }]}>{formatMs(recordingMs)}</Text>
        <Text style={[styles.recordingLabel, { color: colors.bright }]}>Recording…</Text>
      </View>
      <View style={styles.recordingActions}>
        <TouchableOpacity onPress={cancel} activeOpacity={0.7}>
          <Text style={[styles.recordCancelText, { color: colors.bright }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.recordSaveBtn, { backgroundColor: colors.accent }]}
          onPress={stopAndSave}
          disabled={phase === 'saving'}
          activeOpacity={0.8}
        >
          <Text style={[styles.recordSaveBtnText, { color: colors.white }]}>
            {phase === 'saving' ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Playback
  playbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  playBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  playBtnIcon: { fontSize: 13 },
  playbackMid: { flex: 1, gap: 6 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  playbackMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  playbackTime: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13 },
  playbackCreated: { fontFamily: 'System', fontSize: 9, fontWeight: '500', opacity: 0.5 },
  deleteBtn: { fontSize: 14, paddingHorizontal: 4, opacity: 0.5 },

  // Recorder idle
  recordStartBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 14, paddingHorizontal: 18 },
  micDot: { width: 8, height: 8, borderRadius: 4 },
  recordStartText: { fontFamily: 'System', fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Recorder active
  recordingActive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  recordingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: { width: 8, height: 8, borderRadius: 4 },
  recordingTimer: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 17 },
  recordingLabel: { fontFamily: 'System', fontSize: 9, fontWeight: '500', opacity: 0.6 },
  recordingActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  recordCancelText: { fontFamily: 'System', fontSize: 10, fontWeight: '500' },
  recordSaveBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  recordSaveBtnText: { fontFamily: 'System', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});