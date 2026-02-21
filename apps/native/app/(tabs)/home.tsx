import { View } from 'react-native';
import { Text, useTheme } from '@repo/native-ui';

export default function HomePlaceholderScreen() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.bgPrimary,
      }}
    >
      <Text
        variant="sub"
        style={{
          textAlign: 'center',
          color: colors.textPrimary,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Coming soon — Activity Feed
      </Text>
    </View>
  );
}
