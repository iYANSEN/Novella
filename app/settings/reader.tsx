import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ReaderSettingsPanel } from '@/components/reader/ReaderSettingsPanel';
import { READER_THEMES } from '@/constants';
import { useReaderStore } from '@/store';
import { COLORS } from '@/constants';

export default function ReaderSettingsRoute() {
  const router = useRouter();
  const { settings } = useReaderStore();
  const theme = READER_THEMES[settings.theme] || READER_THEMES.dark;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.dark.bg }}>
      <ReaderSettingsPanel onClose={() => router.back()} theme={theme} />
    </SafeAreaView>
  );
}
