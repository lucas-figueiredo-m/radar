import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import ConsoleScreen from '../screens/ConsoleScreen';
import NetworkScreen from '../screens/NetworkScreen';
import PerformanceScreen from '../screens/PerformanceScreen';

const Tab = createBottomTabNavigator();

type TabIconProps = {
  label: string;
  emoji: string;
  focused: boolean;
};

const TabIcon = ({ label, emoji, focused }: TabIconProps) => (
  <View style={styles.tabIconContainer}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
      {label}
    </Text>
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Console"
      component={ConsoleScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Console" emoji=">" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Network"
      component={NetworkScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Network" emoji="~" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Performance"
      component={PerformanceScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Perf" emoji="#" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    gap: 4,
  },
  tabEmoji: {
    fontSize: 18,
    color: '#94a3b8',
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#e2e8f0',
  },
});

export default TabNavigator;
