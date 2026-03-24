import 'react-native-reanimated';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadTokens, loading } = useAuthStore();

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { accessToken, loading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('Auth Guard state:', { accessToken: !!accessToken, loading, segments });
    
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!accessToken && !inAuthGroup) {
      console.log('Redirecting to login...');
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup) {
      console.log('Redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [accessToken, segments, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
    </Stack>
  );
}
