import { Platform, StyleSheet, Text, View } from 'react-native';
import ConsoleOption from './ConsoleOption';

const tag = `[iOS ${String(Platform.Version)}]`;

const CONSOLE_OPTIONS = [
  {
    title: 'console.log',
    color: '#22c55e',
    onPress: () =>
      console.log(`${tag} Hello from React Native!`, {
        count: Math.floor(Math.random() * 100),
      }),
  },
  {
    title: 'console.warn',
    color: '#f59e0b',
    onPress: () => console.warn(`${tag} This is a warning message`),
  },
  {
    title: 'console.error',
    color: '#ef4444',
    onPress: () =>
      console.error(`${tag} Something went wrong!`, new Error('Test error')),
  },
  {
    title: 'console.debug',
    color: '#3b82f6',
    onPress: () =>
      console.debug(`${tag} Debug data:`, { user: 'test', items: [1, 2, 3] }),
  },
  {
    title: 'console.log (large object)',
    color: '#6366f1',
    onPress: () =>
      console.log('User profile:', {
        id: 12345,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'admin',
        active: true,
        loginCount: 847,
        lastLogin: '2026-02-27T10:30:00Z',
        preferences: {
          theme: 'dark',
          language: 'en-US',
          notifications: { email: true, push: false, sms: false },
        },
        recentOrders: [
          { orderId: 'ORD-991', total: 59.99, status: 'delivered' },
          { orderId: 'ORD-1042', total: 124.5, status: 'pending' },
        ],
      }),
  },
];

const ConsoleSection = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Console</Text>
    <View style={styles.optionsList}>
      {CONSOLE_OPTIONS.map(option => (
        <ConsoleOption
          key={option.title}
          title={option.title}
          color={option.color}
          onPress={option.onPress}
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

export default ConsoleSection;
