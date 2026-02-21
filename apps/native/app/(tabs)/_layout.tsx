import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { hapticSelection } from '@/lib/haptics';
import { getModule, type ModuleId } from '@repo/logic';

const TAB_BAR_BG_LIGHT = '#FFFFFF';
const TAB_BAR_BG_DARK = '#1A1A1A';

function useModuleFlags() {
  return {
    home: process.env.EXPO_PUBLIC_MODULE_HOME_ENABLED === 'true',
    money: true,
    tasks: process.env.EXPO_PUBLIC_MODULE_TASKS_ENABLED === 'true',
    calendar: process.env.EXPO_PUBLIC_MODULE_CALENDAR_ENABLED === 'true',
  };
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const flags = useModuleFlags();
  const isDark = colorScheme === 'dark';
  const tabBarBg = isDark ? TAB_BAR_BG_DARK : TAB_BAR_BG_LIGHT;

  const moduleColor = (id: ModuleId) =>
    isDark ? getModule(id).colorDark : getModule(id).colorLight;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: isDark ? '#333' : '#eee',
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 10,
          textTransform: 'uppercase',
        },
        headerShown: false,
      }}
      screenListeners={{
        tabPress: () => hapticSelection(),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Money',
          tabBarActiveTintColor: moduleColor('money'),
          tabBarIcon: ({ color }) => <TabBarIcon name="gbp" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarActiveTintColor: moduleColor('home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          href: flags.home ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Blueprint',
          href: null,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarActiveTintColor: moduleColor('tasks'),
          tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
          href: flags.tasks ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarActiveTintColor: moduleColor('calendar'),
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
          href: flags.calendar ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarActiveTintColor: moduleColor('money'),
          tabBarIcon: ({ color }) => <TabBarIcon name="ellipsis-h" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: null,
        }}
      />
    </Tabs>
  );
}
