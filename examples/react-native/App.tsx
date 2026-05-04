import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import { counterStore } from './src/stores/counterStore';

if (__DEV__) {
  const { init } = require('radar-devtools');
  init({
    stores: { counter: counterStore },
  });
}

const onReady = () => {
  if (__DEV__) {
    const { markInteractive } = require('radar-devtools');
    markInteractive();
  }
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    console.log(`App mounted on iOS ${String(Platform.Version)}`);
    console.debug('Debug info:', { screen: 'Main', timestamp: Date.now() });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer
        onReady={onReady}
        theme={{
          dark: true,
          colors: {
            primary: '#6366f1',
            background: '#0f172a',
            card: '#1e293b',
            text: '#f8fafc',
            border: '#334155',
            notification: '#ef4444',
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '900' },
          },
        }}
      >
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
