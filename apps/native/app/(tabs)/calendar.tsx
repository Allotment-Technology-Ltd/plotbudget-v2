import { View } from 'react-native';
import { Text, useTheme } from '@repo/native-ui';
import { getModule } from '@repo/logic';

const calendarColorLight = getModule('calendar').colorLight;
const calendarColorDark = getModule('calendar').colorDark;

export default function CalendarPlaceholderScreen() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const accent = isDark ? calendarColorDark : calendarColorLight;

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
      <View style={{ borderLeftWidth: 4, borderLeftColor: accent, paddingLeft: 12 }}>
        <Text
          variant="sub"
          style={{
            color: colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Calendar module coming soon
        </Text>
      </View>
    </View>
  );
}
