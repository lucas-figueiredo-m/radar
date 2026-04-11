import { Tabs } from 'expo-router';
import { init, markInteractive } from 'radar-devtools';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { createMMKV } from 'react-native-mmkv';
import { useTodoStore } from '../stores/todoStore';

const defaultStorage = createMMKV();
const settingsStorage = createMMKV({ id: 'settings' });

init({
  mmkvInstances: {
    default: defaultStorage,
    settings: settingsStorage,
  },
  stores: { todos: useTodoStore },
});

const TabLayout = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    markInteractive();
  }, [ready]);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1e293b',
            borderTopColor: '#334155',
            borderTopWidth: 1,
            height: 72,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          tabBarActiveTintColor: '#e2e8f0',
          tabBarInactiveTintColor: '#64748b',
        }}
        screenListeners={{
          state: () => {
            if (!ready) setReady(true);
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Console', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="network"
          options={{ title: 'Network', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="performance"
          options={{ title: 'Perf', tabBarIcon: () => null }}
        />
        <Tabs.Screen
          name="storage"
          options={{ title: 'Storage', tabBarIcon: () => null }}
        />
      </Tabs>
    </>
  );
};

export default TabLayout;
