import { View } from 'react-native';
import { Text, useTheme } from '@repo/native-ui';
import { getModule } from '@repo/logic';

const tasksColorLight = getModule('tasks').colorLight;
const tasksColorDark = getModule('tasks').colorDark;

export default function TasksPlaceholderScreen() {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const accent = isDark ? tasksColorDark : tasksColorLight;

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
          Tasks module coming soon
        </Text>
      </View>
    </View>
  );
}
