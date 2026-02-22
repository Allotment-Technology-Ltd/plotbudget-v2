import { View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, useTheme } from '@repo/native-ui';
import { getModule } from '@repo/logic';

const holidaysColorLight = getModule('holidays').colorLight;
const holidaysColorDark = getModule('holidays').colorDark;

type TripSummary = {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`;
}

export default function HolidaysListScreen() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const accent = isDark ? holidaysColorDark : holidaysColorLight;
  const router = useRouter();

  // Trips are loaded via TanStack Query in a real implementation;
  // rendered as a placeholder list for now with navigation scaffolding.
  const trips: TripSummary[] = [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#333' : '#eee',
        }}
      >
        <Text
          variant="sub"
          style={{
            color: colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Holidays
        </Text>
      </View>

      {trips.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View style={{ borderLeftWidth: 4, borderLeftColor: accent, paddingLeft: 12 }}>
            <Text variant="body" style={{ color: colors.textPrimary }}>
              No trips yet
            </Text>
            <Text variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
              Add your first trip to start planning.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList<TripSummary>
          data={trips}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          windowSize={5}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(tabs)/holidays/${item.id}` as never)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? '#333' : '#eee',
                borderLeftWidth: 4,
                borderLeftColor: accent,
                backgroundColor: colors.bgSecondary,
                padding: 16,
              })}
              accessibilityRole="button"
              accessibilityLabel={`Open trip: ${item.name}`}
            >
              <Text
                variant="sub"
                style={{
                  color: colors.textPrimary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {item.name}
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary, marginBottom: 2 }}>
                {item.destination}
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary }}>
                {formatDateRange(item.start_date, item.end_date)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
