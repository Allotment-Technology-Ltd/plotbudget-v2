import 'react-native-gesture-handler';
import '../global.css';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useSegments, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type ReactNode, useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@repo/native-ui';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemePreferenceProvider, useThemePreference } from '@/contexts/ThemePreferenceContext';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useNavigationPersistence } from '@/lib/navigation-persistence';
import {
  useOnboardingStatus,
  OnboardingStatusProvider,
} from '@/contexts/OnboardingStatusContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const fontMap = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- expo-font requires require() for assets
  SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  ...FontAwesome.font,
};

function FontLoader({ children }: { children: ReactNode }) {
  const [loaded, error] = useFonts(fontMap);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return children;
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <OnboardingStatusProvider>
          <FontLoader>
            <ThemePreferenceProvider>
              <RootLayoutNav />
            </ThemePreferenceProvider>
          </FontLoader>
        </OnboardingStatusProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

function AuthGate() {
  const { session, loading: authLoading } = useAuth();
  const { completed: onboardingCompleted, loading: onboardingLoading } = useOnboardingStatus();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    const first = segments[0] as string;
    const inAuthGroup = first === '(auth)';
    const inOnboardingGroup = first === '(onboarding)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as import('expo-router').Href);
      return;
    }
    if (session && inAuthGroup) {
      if (onboardingLoading) return;
      if (onboardingCompleted === false) {
        router.replace('/(onboarding)' as import('expo-router').Href);
      } else {
        router.replace('/(tabs)');
      }
      return;
    }
    if (session && !inOnboardingGroup && onboardingCompleted === false && !onboardingLoading) {
      router.replace('/(onboarding)' as import('expo-router').Href);
      return;
    }
    if (session && inOnboardingGroup && onboardingCompleted === true) {
      router.replace('/(tabs)/two' as import('expo-router').Href);
    }
  }, [authLoading, session, segments, router, onboardingCompleted, onboardingLoading]);

  return null;
}

function RootLayoutNav() {
  const { resolvedScheme } = useThemePreference();
  useNavigationPersistence();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider colorScheme={resolvedScheme}>
          <AppErrorBoundary>
            <NavigationThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthGate />
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
            </NavigationThemeProvider>
          </AppErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
