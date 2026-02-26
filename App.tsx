import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { themes } from './constants/theme';
import { ThemeContext } from './context/ThemeContext';
import { useThoughts } from './hooks/useThoughts';
import { useEmotions } from './hooks/useEmotions';
import { usePhotos } from './hooks/usePhotos';
import { useHabits } from './hooks/useHabits';
import DashboardScreen from './components/DashboardScreen';
import ArchiveScreen from './components/ArchiveScreen';
import ProfileScreen from './components/ProfileScreen';

type Tab = 'today' | 'archive' | 'profile';
type ThemeKey = 'linen' | 'dusk' | 'sage' | 'slate' | 'parchment' | 'midnight' | 'rose' | 'forest' | 'chalk';

function Inner() {
  const [activeTab, setActiveTab] = React.useState<Tab>('today');
  const [themeKey, setThemeKey] = React.useState<ThemeKey>('linen');
  const colors = themes[themeKey]?.colors ?? themes.linen.colors;
  const setTheme = (key: ThemeKey) => setThemeKey(key);

  const { thoughts, user, loading, addThought, deleteThought, updateUsername } = useThoughts();
  const { todayEmotions, toggleEmotion, confirmSave, history: emotionHistory, saved } = useEmotions();
  const { todayPhoto, savePhoto, removePhoto, getPhotoForDate } = usePhotos();
  const { todayHabits, toggleHabit, confirmSave: confirmHabitSave, history: habitHistory, saved: habitsSaved } = useHabits();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>m.</Text>
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ themeKey, colors, setTheme }}>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right']}>
        <StatusBar
          barStyle={themeKey === 'dusk' || themeKey === 'midnight' || themeKey === 'forest' ? 'light-content' : 'dark-content'}
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
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen thoughts={thoughts} user={user} onUpdateUsername={updateUsername} />
          )}
        </View>
        <SafeAreaView edges={['bottom']} style={[styles.tabBarSafe, { backgroundColor: colors.bg }]}>
          <View style={[styles.tabBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
            {(['today', 'archive', 'profile'] as Tab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabLabel,
                  { color: colors.border2 },
                  activeTab === tab && { color: colors.accent },
                ]}>
                  {tab}
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