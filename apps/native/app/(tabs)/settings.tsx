import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.heading, isDark && styles.textDark]}>Account</Text>

      {session?.user?.email != null && (
        <Text style={[styles.email, isDark && styles.textDark]}>
          {session.user.email}
        </Text>
      )}

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        onPress={() => void signOut()}
        accessibilityRole="button"
        accessibilityLabel="Sign out">
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1c1c1e',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  email: {
    fontSize: 16,
    marginBottom: 32,
    color: '#555',
  },
  textDark: {
    color: '#fff',
  },
  signOut: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  signOutPressed: {
    opacity: 0.7,
  },
  signOutText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
