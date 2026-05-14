import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator } from 'react-native';
import { initSources } from '@/plugins';
import { useReaderStore, useAppSettingsStore } from '@/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30000 },
  },
});

function AppReady({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const hydrateReader = useReaderStore((s: any) => s.hydrate);
  const hydrateApp = useAppSettingsStore((s: any) => s.hydrate);

  useEffect(() => {
    Promise.all([
      hydrateReader?.(),
      hydrateApp?.(),
    ]).finally(() => setReady(true));
    initSources();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d0d14', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppReady>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="novel/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="reader/[novelId]/[chapterId]" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="search" options={{ headerShown: false }} />
              <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
              <Stack.Screen name="history" options={{ headerShown: false }} />
              <Stack.Screen name="downloads" options={{ headerShown: false }} />
              <Stack.Screen name="stats" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="settings/reader" options={{ headerShown: false }} />
              <Stack.Screen name="settings/sources" options={{ headerShown: false }} />
            </Stack>
          </AppReady>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}