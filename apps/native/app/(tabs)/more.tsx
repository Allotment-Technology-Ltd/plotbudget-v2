import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, useTheme } from '@repo/native-ui';

export default function MoreScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        paddingTop: 48,
        backgroundColor: colors.bgPrimary,
      }}
    >
      <Text
        variant="sub"
        style={{
          marginBottom: 16,
          color: colors.textPrimary,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        More
      </Text>
      <Pressable
        onPress={() => router.push('/(tabs)/two')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 0,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <FontAwesome name="list" size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
        <Text variant="body" style={{ color: colors.textPrimary }}>
          Blueprint
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/(tabs)/settings')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 0,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <FontAwesome name="cog" size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
        <Text variant="body" style={{ color: colors.textPrimary }}>
          Settings
        </Text>
      </Pressable>
    </View>
  );
}
