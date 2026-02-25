import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './constants/theme';
import { useThoughts } from './hooks/useThoughts';
import { useEmotions } from './hooks/useEmotions';
import { usePhotos } from './hooks/usePhotos';
import DashboardScreen from './components/DashboardScreen';
import ArchiveScreen from './components/ArchiveScreen';
import ProfileScreen from './components/ProfileScreen';

type Tab = 'today' | 'archive' | 'profile';

function Inner() {
  const [activeTab, setActiveTab] = React.useState<Tab>('today');
  const { thoughts, user, loading, addThought, deleteThought, updateUsername } = useThoughts();
  const { todayEmotions, toggleEmotion, confirmSave, history: emotionHistory, saved } = useEmotions();
  const { todayPhoto, photoHistory, savePhoto, removePhoto, getPhotoForDate } = usePhotos();

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>m.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerLogo}>m<Text style={styles.headerDot}>.</Text></Text>
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
          />
        )}
        {activeTab === 'archive' && (
          <ArchiveScreen
            thoughts={thoughts}
            user={user}
            emotionHistory={emotionHistory}
            onDelete={deleteThought}
            getPhotoForDate={getPhotoForDate}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen thoughts={thoughts} user={user} onUpdateUsername={updateUsername} />
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          {(['today', 'archive', 'profile'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaView>
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
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 28,
    fontWeight: '300', color: colors.muted,
  },
  header: {
    height: 50, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: '#ECEAE4', backgroundColor: colors.bg,
  },
  headerLogo: {
    fontFamily: 'Georgia', fontStyle: 'italic', fontWeight: '300',
    fontSize: 20, color: colors.bright, letterSpacing: 0.2,
  },
  headerDot: { color: colors.accent, fontStyle: 'normal' },
  content: { flex: 1 },
  tabBarSafe: { backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ECEAE4',
    backgroundColor: colors.bg, height: 54,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabLabel: {
    fontFamily: 'System', fontSize: 9, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', color: colors.border2,
  },
  tabLabelActive: { color: colors.accent },
  tabDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.accent },
});