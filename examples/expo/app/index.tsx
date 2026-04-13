import React from 'react';
import { Platform, Text } from 'react-native';
import ActionButton from '../src/components/ActionButton';
import ConsoleOption from '../src/components/ConsoleOption';
import ScreenContainer from '../src/components/ScreenContainer';
import SectionGroup from '../src/components/SectionGroup';

const tag = `[iOS ${String(Platform.Version)}]`;

const BASIC_OPTIONS = [
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
];

const DATA_TYPE_OPTIONS = [
  {
    title: 'Large object',
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
  {
    title: 'Function',
    color: '#8b5cf6',
    onPress: () =>
      console.log('Function:', {
        handler: () => {},
        add: function add(_a: number, _b: number) {
          return 0;
        },
      }),
  },
  {
    title: 'undefined & null',
    color: '#64748b',
    onPress: () =>
      console.log('Undefined:', undefined, {
        missing: undefined,
        present: null,
      }),
  },
  {
    title: 'Symbol',
    color: '#ec4899',
    onPress: () =>
      console.log('Symbol:', Symbol('mySymbol'), {
        id: Symbol('unique'),
      }),
  },
  {
    title: 'BigInt',
    color: '#14b8a6',
    onPress: () =>
      console.log('BigInt:', BigInt(9007199254740991), {
        count: BigInt(42),
      }),
  },
  {
    title: 'Circular reference',
    color: '#f97316',
    onPress: () => {
      const obj: Record<string, unknown> = { name: 'circular', children: [] };
      (obj.children as unknown[]).push(obj);
      console.log('Circular:', obj);
    },
  },
  {
    title: 'React element',
    color: '#06b6d4',
    onPress: () =>
      console.log('Element:', React.createElement(Text, null, 'Hello')),
  },
  {
    title: 'Mixed types',
    color: '#a855f7',
    onPress: () =>
      console.log('Mixed:', {
        fn: () => {},
        sym: Symbol('x'),
        undef: undefined,
        big: BigInt(1),
        nested: { deep: true },
      }),
  },
];

const BATCH_OPTIONS = [
  {
    title: 'Burst 50 logs',
    subtitle: 'Rapid-fire 50 log messages',
    color: '#f43f5e',
    onPress: () => {
      for (let i = 0; i < 50; i++) {
        console.log(`Burst log #${i + 1}`, { index: i, timestamp: Date.now() });
      }
    },
  },
  {
    title: 'Mixed burst',
    subtitle: '20 logs across all levels',
    color: '#d946ef',
    onPress: () => {
      const levels = ['log', 'warn', 'error', 'debug'] as const;
      for (let i = 0; i < 20; i++) {
        const level = levels[i % levels.length];
        console[level](`Mixed burst #${i + 1}`, { level, index: i });
      }
    },
  },
];

const ConsoleScreen = () => (
  <ScreenContainer
    title="Console"
    subtitle="Test console log capture and serialization"
  >
    <SectionGroup title="Log Levels">
      {BASIC_OPTIONS.map(option => (
        <ConsoleOption
          key={option.title}
          title={option.title}
          color={option.color}
          onPress={option.onPress}
        />
      ))}
    </SectionGroup>

    <SectionGroup title="Data Types">
      {DATA_TYPE_OPTIONS.map(option => (
        <ConsoleOption
          key={option.title}
          title={option.title}
          color={option.color}
          onPress={option.onPress}
        />
      ))}
    </SectionGroup>

    <SectionGroup title="Stress Test">
      {BATCH_OPTIONS.map(option => (
        <ActionButton
          key={option.title}
          title={option.title}
          subtitle={option.subtitle}
          color={option.color}
          onPress={option.onPress}
        />
      ))}
    </SectionGroup>
  </ScreenContainer>
);

export default ConsoleScreen;
