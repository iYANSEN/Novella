import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLibrary, getChapters, upsertChapters } from '@/utils/database';
import { sourceRegistry } from '@/plugins';
import { COLORS } from '@/constants';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { syncLibrary, type SyncProgress } from '@/utils/librarySync';

dayjs.extend(relativeTime);

export default function UpdatesTab() {
  const router = useRouter();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  const { data: updates = [], isLoading, refetch } = useQuery({
    queryKey: ['updates'],
    queryFn: async () => {
      const library = await getLibrary();
      const updateResults: Array<{ novel: any; newChapters: number; latestChapter: any }> = [];

      for (const novel of library.filter(n => n.readingStatus === 'reading')) {
        try {
          const source = sourceRegistry.get(novel.sourceId);
          if (!source) continue;

          const [existingChapters, freshChapters] = await Promise.all([
            getChapters(novel.id),
            source.getChapterList(novel.novelPath),
          ]);

          const newOnes = freshChapters.filter(
            fc => !existingChapters.find(ec => ec.chapterPath === (fc as any).chapterPath)
          );

          if (newOnes.length > 0) {
            await upsertChapters(newOnes as any);
            updateResults.push({
              novel,
              newChapters: newOnes.length,
              latestChapter: newOnes[newOnes.length - 1],
            });
          }
        } catch {}
      }
      return updateResults;
    },
    staleTime: 300000, // 5 min
  });

  const handleSync = async () => {
    setSyncing(true);
    await syncLibrary((p) => setSyncProgress(p));
    setSyncing(false);
    setSyncProgress(null);
    refetch();
    qc.invalidateQueries({ queryKey: ['library'] });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Updates</Text>
          {syncProgress && (
            <Text style={styles.syncProgressText}>
              Syncing {syncProgress.done}/{syncProgress.total}: {syncProgress.current}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleSync}
          disabled={syncing}
          style={[styles.syncBtn, syncing && { opacity: 0.5 }]}
        >
          <Text style={styles.syncBtnText}>{syncing ? '⟳ Syncing...' : '⟳ Sync All'}</Text>
        </TouchableOpacity>
      </View>

      {updates.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>No new chapters for novels in your reading list</Text>
        </View>
      ) : (
        <FlatList
          data={updates}
          keyExtractor={item => item.novel.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#7c3aed" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push({ pathname: '/novel/[id]', params: { id: item.novel.id } })}
              activeOpacity={0.75}
            >
              <View style={styles.cover}>
                {item.novel.coverUrl ? (
                  <Image source={{ uri: item.novel.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                ) : <Text style={styles.coverPlaceholder}>📖</Text>}
              </View>
              <View style={styles.info}>
                <Text style={styles.novelTitle} numberOfLines={1}>{item.novel.title}</Text>
                <Text style={styles.chapterInfo} numberOfLines={1}>{item.latestChapter?.title ?? 'New chapter'}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>+{item.newChapters} new</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text },
  list: { padding: 16, gap: 10 },
  item: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.dark.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.dark.border },
  cover: { width: 52, height: 78, borderRadius: 6, backgroundColor: COLORS.dark.surface, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  coverPlaceholder: { fontSize: 22 },
  info: { flex: 1, gap: 4, justifyContent: 'center' },
  novelTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark.text },
  chapterInfo: { fontSize: 12, color: COLORS.dark.textMid },
  badge: { alignSelf: 'flex-start', backgroundColor: '#7c3aed30', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#7c3aed60' },
  badgeText: { color: '#a78bfa', fontSize: 11, fontWeight: '800' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark.text },
  emptyText: { fontSize: 14, color: COLORS.dark.textMid, textAlign: 'center' },
  syncBtn: { backgroundColor: '#7c3aed30', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#7c3aed60' },
  syncBtnText: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  syncProgressText: { color: '#a78bfa', fontSize: 12 },
});