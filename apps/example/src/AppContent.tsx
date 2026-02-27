import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConsoleSection from './ConsoleSection';
import NetworkSection from './NetworkSection';

const AppContent = () => {
  const safeAreaInsets = useSafeAreaInsets();

  useEffect(() => {
    console.log('App mounted!');
    console.debug('Debug info:', { screen: 'Main', timestamp: Date.now() });
  }, []);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: safeAreaInsets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Radar Test App</Text>
        <Text style={styles.subtitle}>
          Tap buttons below to test console + network capture
        </Text>
      </View>

      <ConsoleSection />
      <NetworkSection />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default AppContent;
