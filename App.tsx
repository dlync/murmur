import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeKey } from './constants/theme';
import { ThemeContext } from './context/ThemeContext';
import { useThoughts } from './hooks/useThoughts';
import { useEmotions } from './hooks/useEmotions';
import { usePhotos } from './hooks/usePhotos';
import { useHabits } from './hooks/useHabits';
import { useEvents } from './hooks/useEvents';
import { useVoiceNotes } from './hooks/useVoiceNotes';
import DashboardScreen from './components/DashboardScreen';
import ArchiveScreen from './components/ArchiveScreen';
import ProfileScreen from './components/ProfileScreen';
import OnboardingScreen from './components/OnboardingScreen';

type Tab = 'today' | 'archive' | 'profile';
const ONBOARDED_KEY = '@murmur_onboarded';

function Inner() {
  const [activeTab, setActiveTab] = React.useState<Tab>('today');
  const [themeKey, setThemeKey] = React.useState<ThemeKey>('linen');
  const [onboarded, setOnboarded] = React.useState<boolean | null>(null);
  const colors = themes[themeKey]?.colors ?? themes.linen.colors;
  const setTheme = (key: ThemeKey) => setThemeKey(key);

  const { thoughts, user, loading, addThought, deleteThought, updateUsername } = useThoughts();
  const { todayEmotions, toggleEmotion, confirmSave, history: emotionHistory, saved } = useEmotions();
  const { todayPhoto, savePhoto, removePhoto, getPhotoForDate } = usePhotos();
  const { todayHabits, toggleHabit, confirmSave: confirmHabitSave, history: habitHistory, saved: habitsSaved } = useHabits();
  const { events, addEvent, deleteEvent, updateEvent, getEventsForDate } = useEvents();
  const { notes: voiceNotes, addNote, deleteNote, getNotesForDate } = useVoiceNotes();

  React.useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((val) => setOnboarded(val === '1'))
      .catch(() => setOnboarded(false));
  }, []);

  async function completeOnboarding(name: string) {
    await updateUsername(name);
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    setOnboarded(true);
  }

  const isDark = themeKey === 'ember' || themeKey === 'pine' || themeKey === 'noir' || themeKey === 'carbon';

  if (loading || onboarded === null) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>m.</Text>
      </View>
    );
  }

  if (!onboarded) {
    return (
      <ThemeContext.Provider value={{ themeKey, colors, setTheme }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <OnboardingScreen onComplete={completeOnboarding} />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ themeKey, colors, setTheme }}>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right']}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.bg}
        />
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerLogo, { color: colors.bright }]}>
            m<Text style={[styles.headerDot, { color: colors.accent }]}>.</Text>
          </Text>
        </View>
        <View style={styles.content}>
          {activeTab === 'today' && (
            <DashboardScreen
              thoughts={thoughts}
              user={user}
              onAdd={addThought}
              todayEmotions={todayEmotions}
              onToggleEmotion={toggleEmotion}
              onConfirmSave={confirmSave}
              emotionsSaved={saved}
              todayPhoto={todayPhoto}
              onSavePhoto={savePhoto}
              onRemovePhoto={() => removePhoto(new Date().toISOString().split('T')[0])}
              todayHabits={todayHabits}
              onToggleHabit={toggleHabit}
              onConfirmHabitSave={confirmHabitSave}
              habitsSaved={habitsSaved}
              todayVoiceNotes={getNotesForDate(new Date().toISOString().split('T')[0])}
              onAddVoiceNote={(uri, ms) => addNote(new Date().toISOString().split('T')[0], uri, ms)}
              onDeleteVoiceNote={deleteNote}
            />
          )}
          {activeTab === 'archive' && (
            <ArchiveScreen
              thoughts={thoughts}
              user={user}
              emotionHistory={emotionHistory}
              habitHistory={habitHistory}
              onDelete={deleteThought}
              getPhotoForDate={getPhotoForDate}
              events={events}
              onAddEvent={addEvent}
              onDeleteEvent={deleteEvent}
              onUpdateEvent={updateEvent}
              getEventsForDate={getEventsForDate}
              getVoiceNotesForDate={getNotesForDate}
              voiceNotes={voiceNotes}
              onDeleteVoiceNote={deleteNote}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen thoughts={thoughts} user={user} onUpdateUsername={updateUsername} />
          )}
        </View>
        <SafeAreaView edges={['bottom']} style={[styles.tabBarSafe, { backgroundColor: colors.bg }]}>
          <View style={[styles.tabBar, { backgroundColor: colors.bg, borderTopColor: colors.bright }]}>
            {(['today', 'archive', 'profile'] as Tab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabLabel,
                  { color: colors.bright },
                  activeTab === tab && { color: colors.accent },
                ]}>
                  {tab === 'archive' ? 'logs' : tab}
                </Text>
                {activeTab === tab && <View style={[styles.tabDot, { backgroundColor: colors.accent }]} />}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Inner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 28, fontWeight: '300' },
  header: { height: 50, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1 },
  headerLogo: { fontFamily: 'Georgia', fontStyle: 'italic', fontWeight: '300', fontSize: 20, letterSpacing: 0.2 },
  headerDot: { fontStyle: 'normal' },
  content: { flex: 1 },
  tabBarSafe: {},
  tabBar: { flexDirection: 'row', borderTopWidth: 1, height: 54 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabLabel: { fontFamily: 'System', fontSize: 9, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  tabDot: { width: 3, height: 3, borderRadius: 1.5 },
});