import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, useTheme } from '@repo/native-ui';
import { getModule } from '@repo/logic';

const holidaysColorLight = getModule('holidays').colorLight;
const holidaysColorDark = getModule('holidays').colorDark;

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const accent = isDark ? holidaysColorDark : holidaysColorLight;

  // Trip data, itinerary, budget, and packing are loaded via TanStack Query in a real implementation;
  // rendered as scaffolding with the navigation params ready.
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      contentContainerStyle={{ padding: 24, paddingTop: 56 }}
    >
      <View style={{ borderLeftWidth: 4, borderLeftColor: accent, paddingLeft: 12, marginBottom: 24 }}>
        <Text
          variant="sub"
          style={{
            color: colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Trip detail
        </Text>
        <Text variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
          Trip ID: {id}
        </Text>
      </View>

      {/* Itinerary section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          variant="sub"
          style={{
            color: colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Itinerary
        </Text>
        <Text variant="caption" style={{ color: colors.textSecondary }}>
          No itinerary entries yet.
        </Text>
      </View>

      {/* Budget section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          variant="sub"
          style={{
            color: colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Budget
        </Text>
        <Text variant="caption" style={{ color: colors.textSecondary }}>
          No budget items yet.
        </Text>
      </View>

      {/* Packing list section */}
      <View style={{ marginBottom: 24 }}>
        <Text
          variant="sub"
          style={{
            color: colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Packing list
        </Text>
        <Text variant="caption" style={{ color: colors.textSecondary }}>
          No packing items yet.
        </Text>
      </View>
    </ScrollView>
  );
}
