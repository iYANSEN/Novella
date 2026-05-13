import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useAppSettingsStore, useReaderStore } from '@/store';
import { COLORS } from '@/constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAppSettingsStore();
  const { resetSettings: resetReader } = useReaderStore();
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Export DB as JSON backup
      const path = `${FileSystem.documentDirectory}novella_backup_${Date.now()}.json`;
      const data = { exportedAt: new Date().toISOString(), settings, version: 1 };
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    } catch (e) {
      Alert.alert('Export failed', String(e));
    } finally {
      setExportLoading(false);
    }
  };

  const handleResetReader = () => {
    Alert.alert('Reset Reader Settings', 'This will reset all reading preferences to defaults.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetReader },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Sources */}
        <Section label="Sources">
          <SettingRow label="Manage Sources" onPress={() => router.push('/settings/sources')} hasArrow />
        </Section>

        {/* Appearance */}
        <Section label="Appearance">
          <SettingRow label="App Theme">
            <View style={styles.segmented}>
              {(['light', 'dark', 'system'] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => updateSettings({ theme: t })}
                  style={[styles.segment, settings.theme === t && styles.segmentActive]}>
                  <Text style={[styles.segmentText, settings.theme === t && styles.segmentTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingRow>
          <SettingRow label="Library Columns">
            <View style={styles.segmented}>
              {([2, 3, 4] as const).map(n => (
                <TouchableOpacity key={n} onPress={() => updateSettings({ gridColumns: n })}
                  style={[styles.segment, settings.gridColumns === n && styles.segmentActive]}>
                  <Text style={[styles.segmentText, settings.gridColumns === n && styles.segmentTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingRow>
        </Section>

        {/* Library */}
        <Section label="Library">
          <SettingRow label="Show NSFW Content">
            <Switch value={settings.showNsfw} onValueChange={v => updateSettings({ showNsfw: v })} trackColor={{ true: '#7c3aed' }} thumbColor="#fff" />
          </SettingRow>
          <SettingRow label="Auto-add to Library on Read">
            <Switch value={settings.autoAddToLibrary} onValueChange={v => updateSettings({ autoAddToLibrary: v })} trackColor={{ true: '#7c3aed' }} thumbColor="#fff" />
          </SettingRow>
          <SettingRow label="Auto-mark Chapter as Read">
            <Switch value={settings.autoMarkRead} onValueChange={v => updateSettings({ autoMarkRead: v })} trackColor={{ true: '#7c3aed' }} thumbColor="#fff" />
          </SettingRow>
        </Section>

        {/* Downloads */}
        <Section label="Downloads">
          <SettingRow label="Wi-Fi Only">
            <Switch value={settings.downloadOnWifiOnly} onValueChange={v => updateSettings({ downloadOnWifiOnly: v })} trackColor={{ true: '#7c3aed' }} thumbColor="#fff" />
          </SettingRow>
          <SettingRow label="Auto-download New Chapters">
            <Switch value={settings.autoDownloadNewChapters} onValueChange={v => updateSettings({ autoDownloadNewChapters: v })} trackColor={{ true: '#7c3aed' }} thumbColor="#fff" />
          </SettingRow>
          <SettingRow label="Update Check" onPress={() => router.push('/settings/download')} hasArrow />
        </Section>

        {/* Reader */}
        <Section label="Reader">
          <SettingRow label="Reader Settings" onPress={() => router.push('/settings/reader')} hasArrow />
          <SettingRow label="Reset Reader to Defaults" onPress={handleResetReader} danger />
        </Section>

        {/* Backup */}
        <Section label="Backup & Data">
          <SettingRow label={exportLoading ? 'Exporting...' : 'Export Backup'} onPress={handleExport} hasArrow />
        </Section>

        {/* About */}
        <Section label="About">
          <SettingRow label="Novella" />
          <SettingRow label="Version 1.0.0" />
          <SettingRow label="Open Source — MIT License" />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({ label, children, onPress, hasArrow, danger }: {
  label: string; children?: React.ReactNode; onPress?: () => void; hasArrow?: boolean; danger?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, danger && { color: '#f87171' }]}>{label}</Text>
      <View style={styles.rowRight}>
        {children}
        {hasArrow && <Text style={styles.arrow}>›</Text>}
      </View>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
  ) : content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text },
  scroll: { padding: 16, gap: 0 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: COLORS.dark.textDim, letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: COLORS.dark.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.dark.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border + '50' },
  rowLabel: { fontSize: 15, color: COLORS.dark.text, fontWeight: '500', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { fontSize: 20, color: COLORS.dark.textDim },
  segmented: { flexDirection: 'row', backgroundColor: COLORS.dark.surface, borderRadius: 8, padding: 2 },
  segment: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  segmentActive: { backgroundColor: '#7c3aed' },
  segmentText: { fontSize: 13, color: COLORS.dark.textMid, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
});
