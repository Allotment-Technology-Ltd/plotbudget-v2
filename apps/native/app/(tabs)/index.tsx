import { Text, View } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';

export default function TabOneScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-plot-bg-primary">
      <Text className="text-xl font-bold text-plot-text-primary">Tab One</Text>
      <View className="my-8 h-px w-4/5 bg-plot-border-subtle" />
      <Text className="text-plot-text-secondary">PLOT design tokens (NativeWind)</Text>
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}
