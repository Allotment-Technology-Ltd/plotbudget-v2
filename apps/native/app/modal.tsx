import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { View } from '@/components/Themed';

export default function ModalScreen() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      {session?.user?.email != null && (
        <Text style={styles.email}>{session.user.email}</Text>
      )}
      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        onPress={() => void signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.8,
  },
  signOut: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  signOutPressed: {
    opacity: 0.8,
  },
  signOutText: {
    color: '#fff',
    fontWeight: '600',
  },
});
