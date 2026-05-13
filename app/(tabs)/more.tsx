import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getDownloadTasks } from '@/utils/database';
import { COLORS } from '@/constants';

const MENU_ITEMS = [
  { icon: '📅', label: 'History', route: '/history' as const },
  { icon: '🔖', label: 'Bookmarks', route: '/bookmarks' as const },
  { icon: '⬇️', label: 'Downloads', route: '/downloads' as const },
  { icon: '📊', label: 'Statistics', route: '/stats' as const },
  { icon: '⚙️', label: 'Settings', route: '/settings' as const },
];

export default function MoreTab() {
  const router = useRouter();
  const { data: downloads = [] } = useQuery({ queryKey: ['downloadTasks'], queryFn: getDownloadTasks, staleTime: 10000 });
  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>More</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.menu}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.label === 'Downloads' && activeDownloads > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeDownloads}</Text>
                </View>
              )}
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Novella v1.0.0</Text>
          <Text style={styles.footerSub}>Open source novel reader</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text, paddingHorizontal: 16, paddingBottom: 16 },
  scroll: { padding: 16, gap: 24 },
  menu: { backgroundColor: COLORS.dark.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.dark.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border + '40' },
  menuIcon: { width: 38, height: 38, backgroundColor: '#7c3aed20', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuIconText: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: 16, color: COLORS.dark.text, fontWeight: '600' },
  badge: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  arrow: { fontSize: 20, color: COLORS.dark.textDim },
  footer: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  footerText: { fontSize: 14, color: COLORS.dark.textMid, fontWeight: '700' },
  footerSub: { fontSize: 12, color: COLORS.dark.textDim },
});
