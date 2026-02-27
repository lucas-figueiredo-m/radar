import { StyleSheet, Text, View } from 'react-native';
import NetworkItem from './NetworkItem';

const NETWORK_ITEMS = [
  {
    method: 'GET' as const,
    path: '/posts?_limit=3',
    color: '#a855f7',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
        .then(r => r.json())
        .then(data => console.log('Fetched posts:', data.length))
        .catch(err => console.error('Fetch failed:', err));
    },
  },
  {
    method: 'GET' as const,
    path: '/users/1',
    color: '#a855f7',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/users/1')
        .then(r => r.json())
        .then(data => console.log('Fetched user:', data.name))
        .catch(err => console.error('Fetch failed:', err));
    },
  },
  {
    method: 'POST' as const,
    path: '/posts',
    color: '#10b981',
    onPress: () => {
      fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Post',
          body: 'Hello from Radar',
          userId: 1,
        }),
      })
        .then(r => r.json())
        .then(data => console.log('Created post:', data))
        .catch(err => console.error('Post failed:', err));
    },
  },
  {
    method: 'GET' as const,
    path: '/500 (will fail)',
    color: '#ef4444',
    onPress: () => {
      fetch('https://httpstat.us/500')
        .then(r => console.warn('Got status:', r.status))
        .catch(err => console.error('Request failed:', err));
    },
  },
];

const NetworkSection = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Network</Text>
    <View style={styles.optionsList}>
      {NETWORK_ITEMS.map(item => (
        <NetworkItem
          key={`${item.method}-${item.path}`}
          method={item.method}
          path={item.path}
          color={item.color}
          onPress={item.onPress}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
  },
  optionsList: {
    paddingHorizontal: 24,
    gap: 8,
  },
});

export default NetworkSection;
