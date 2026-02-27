/**
 * Radar Test App
 * Tests @radar/devtools console + network capture
 */

import { init } from '@radar/devtools';
import { useEffect } from 'react';
import {
  Button,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

// Initialize radar devtools
init();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
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

      <Text style={styles.sectionTitle}>Console</Text>
      <View style={styles.buttons}>
        <Button
          title="console.log"
          onPress={() => console.log('Hello from React Native!', { count: Math.floor(Math.random() * 100) })}
        />
        <Button
          title="console.warn"
          color="#f59e0b"
          onPress={() => console.warn('This is a warning message')}
        />
        <Button
          title="console.error"
          color="#ef4444"
          onPress={() => console.error('Something went wrong!', new Error('Test error'))}
        />
        <Button
          title="console.debug"
          color="#3b82f6"
          onPress={() => console.debug('Debug data:', { user: 'test', items: [1, 2, 3] })}
        />
        <Button
          title="console.log (large object)"
          color="#6366f1"
          onPress={() => console.log('User profile:', { id: 12345, name: 'Jane Doe', email: 'jane@example.com', role: 'admin', active: true, loginCount: 847, lastLogin: '2026-02-27T10:30:00Z' })}
        />
      </View>

      <Text style={styles.sectionTitle}>Network</Text>
      <View style={styles.buttons}>
        <Button
          title="GET /posts"
          color="#a855f7"
          onPress={() => {
            fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
              .then(r => r.json())
              .then(data => console.log('Fetched posts:', data.length))
              .catch(err => console.error('Fetch failed:', err));
          }}
        />
        <Button
          title="GET /users/1"
          color="#a855f7"
          onPress={() => {
            fetch('https://jsonplaceholder.typicode.com/users/1')
              .then(r => r.json())
              .then(data => console.log('Fetched user:', data.name))
              .catch(err => console.error('Fetch failed:', err));
          }}
        />
        <Button
          title="POST /posts"
          color="#10b981"
          onPress={() => {
            fetch('https://jsonplaceholder.typicode.com/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: 'Test Post', body: 'Hello from Radar', userId: 1 }),
            })
              .then(r => r.json())
              .then(data => console.log('Created post:', data))
              .catch(err => console.error('Post failed:', err));
          }}
        />
        <Button
          title="GET (will fail)"
          color="#ef4444"
          onPress={() => {
            fetch('https://httpstat.us/500')
              .then(r => console.warn('Got status:', r.status))
              .catch(err => console.error('Request failed:', err));
          }}
        />
      </View>
    </ScrollView>
  );
}

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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  buttons: {
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 16,
  },
});

export default App;
