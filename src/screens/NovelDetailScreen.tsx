import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNovel, upsertNovel, getChapters, upsertChapters,
  addToLibrary, removeFromLibrary, markChapterRead,
  getReadingPosition,
} from '@/utils/database';
import { sourceRegistry } from '@/plugins';
import { useDownloadManager } from '@/hooks/useDownloadManager';
import { COLORS } from '@/constants';
import type { Novel, Chapter, ReadingStatus } from '@/types';

const STATUS_LABELS: Record<ReadingStatus, string> = {
  reading: 'Reading', plan_to_read: 'Plan to Read',
  completed: 'Completed', dropped: 'Dropped', on_hold: 'On Hold',
};

export default function NovelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { downloadChapters } = useDownloadManager();
  const [descExpanded, setDescExpanded] = useState(false);
  const [chapterSort, setChapterSort] = useState<'asc' | 'desc'>('asc');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Split id into sourceId:novelPath
  const [sourceId, ...pathParts] = (id ?? '').split(':');
  const novelPath = pathParts.join(':');

  // Load novel from DB (may be partial if not in library)
  const { data: novel, isLoading: novelLoading } = useQuery({
    queryKey: ['novel', id],
    queryFn: async () => {
      let n = await getNovel(id!);
      if (!n) {
        // Fetch from source
        const source = sourceRegistry.get(sourceId);
        if (!source) throw new Error('Source not available');
        const details = await source.getNovelDetails(novelPath);
        const full = { ...details, id: id!, sourceId, novelPath, inLibrary: false } as Novel;
        await upsertNovel(full);
        n = await getNovel(id!);
      }
      return n;
    },
    enabled: !!id,
    staleTime: 60000,
  });

  // Load chapters
  const { data: chapters = [], isLoading: chaptersLoading, refetch: refetchChapters } = useQuery({
    queryKey: ['chapters', id],
    queryFn: async () => {
      let chs = await getChapters(id!);
      if (chs.length === 0) {
        const source = sourceRegistry.get(sourceId);
        if (source) {
          const fetched = await source.getChapterList(novelPath);
          await upsertChapters(fetched as any);
          chs = await getChapters(id!);
          // Update total chapters count
          await upsertNovel({ ...novel!, totalChapters: chs.length });
          qc.invalidateQueries({ queryKey: ['novel', id] });
        }
      }
      return chs;
    },
    enabled: !!id && !!novel,
    staleTime: 120000,
  });

  const libraryMutation = useMutation({
    mutationFn: async ({ action, status }: { action: 'add' | 'remove'; status?: ReadingStatus }) => {
      if (action === 'add') {
        await upsertNovel({ ...novel!, inLibrary: true, readingStatus: status ?? 'reading' });
        await addToLibrary(id!, status ?? 'reading');
      } else {
        await removeFromLibrary(id!);
        await upsertNovel({ ...novel!, inLibrary: false, readingStatus: undefined });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novel', id] });
      qc.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const handleReadPress = async () => {
    if (!chapters.length) return;
    // Check saved position
    const pos = await getReadingPosition(id!);
    const targetChapter = pos
      ? chapters.find(c => c.id === pos.chapterId) ?? chapters[0]
      : chapters[0];
    router.push({ pathname: '/reader/[novelId]/[chapterId]', params: { novelId: id!, chapterId: targetChapter.id } });
  };

  const handleChapterPress = (chapter: Chapter) => {
    router.push({ pathname: '/reader/[novelId]/[chapterId]', params: { novelId: id!, chapterId: chapter.id } });
  };

  const handleDownloadAll = () => {
    if (!novel) return;
    Alert.alert('Download All', `Download all ${chapters.length} chapters?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Download', onPress: () => downloadChapters(chapters, novel) },
    ]);
  };

  const sortedChapters = chapterSort === 'asc' ? chapters : [...chapters].reverse();
  const readCount = chapters.filter(c => c.isRead).length;
  const downloadedCount = chapters.filter(c => c.isDownloaded).length;

  if (novelLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!novel) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: '#f87171', fontSize: 15 }}>Novel not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Hero */}
        <View style={styles.hero}>
          {novel.coverUrl ? (
            <Image source={{ uri: novel.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" blurRadius={12} />
          ) : null}
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.heroContent}>
            {novel.coverUrl ? (
              <Image source={{ uri: novel.coverUrl }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={styles.coverPlaceholder}><Text style={{ fontSize: 40 }}>📖</Text></View>
            )}
            <View style={styles.heroInfo}>
              <Text style={styles.title} numberOfLines={3}>{novel.title}</Text>
              {novel.author && <Text style={styles.author}>{novel.author}</Text>}
              <View style={styles.metaRow}>
                <MetaBadge label={novel.status ?? 'Unknown'} color={novel.status === 'completed' ? '#10b981' : '#7c3aed'} />
                {novel.language && <MetaBadge label={novel.language.toUpperCase()} color="#3b82f6" />}
              </View>
              <Text style={styles.sourceLabel}>{sourceId}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.readBtn, !chapters.length && { opacity: 0.5 }]}
            onPress={handleReadPress}
            disabled={!chapters.length}
          >
            <Text style={styles.readBtnText}>
              {readCount > 0 ? '▶ Continue Reading' : '▶ Start Reading'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.libraryBtn, novel.inLibrary && { backgroundColor: '#7c3aed30', borderColor: '#7c3aed' }]}
            onPress={() => {
              if (novel.inLibrary) {
                libraryMutation.mutate({ action: 'remove' });
              } else {
                libraryMutation.mutate({ action: 'add' });
              }
            }}
          >
            <Text style={[styles.libraryBtnText, novel.inLibrary && { color: '#7c3aed' }]}>
              {novel.inLibrary ? '♥ In Library' : '♡ Add to Library'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sticky chapter header */}
        <View style={styles.chapterHeader}>
          <View style={styles.chapterMeta}>
            <Text style={styles.chapterCount}>{chapters.length} Chapters</Text>
            <Text style={styles.chapterStats}>{readCount} read · {downloadedCount} downloaded</Text>
          </View>
          <View style={styles.chapterActions}>
            <TouchableOpacity onPress={() => setChapterSort(s => s === 'asc' ? 'desc' : 'asc')} style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>{chapterSort === 'asc' ? '↑ Asc' : '↓ Desc'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownloadAll} style={styles.dlBtn}>
              <Text style={styles.dlBtnText}>⬇ All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.description} numberOfLines={descExpanded ? undefined : 4}>
            {novel.description || 'No description available.'}
          </Text>
          {(novel.description?.length ?? 0) > 200 && (
            <TouchableOpacity onPress={() => setDescExpanded(e => !e)}>
              <Text style={styles.expandBtn}>{descExpanded ? 'Show less' : 'Read more'}</Text>
            </TouchableOpacity>
          )}
          {/* Genres */}
          {novel.genres?.length ? (
            <View style={styles.tagsRow}>
              {novel.genres.map(g => (
                <View key={g} style={styles.tag}>
                  <Text style={styles.tagText}>{g}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Chapters */}
        {chaptersLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : (
          sortedChapters.map(ch => (
            <ChapterRow key={ch.id} chapter={ch} onPress={() => handleChapterPress(ch)} />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function ChapterRow({ chapter, onPress }: { chapter: Chapter; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chapterRow, chapter.isRead && styles.chapterRowRead]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.chapterRowLeft}>
        <Text style={[styles.chapterTitle, chapter.isRead && styles.chapterTitleRead]} numberOfLines={1}>
          {chapter.title}
        </Text>
        {chapter.publishedAt && (
          <Text style={styles.chapterDate}>{new Date(chapter.publishedAt).toLocaleDateString()}</Text>
        )}
      </View>
      <View style={styles.chapterRowRight}>
        {chapter.isDownloaded && <Text style={styles.downloadedIcon}>⬇</Text>}
        {chapter.readProgress != null && chapter.readProgress > 0 && chapter.readProgress < 1 && (
          <View style={styles.progressDot}>
            <View style={[styles.progressDotFill, { height: `${chapter.readProgress * 100}%` }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function MetaBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '30', borderColor: color + '60' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  loading: { flex: 1, backgroundColor: COLORS.dark.bg, justifyContent: 'center', alignItems: 'center' },
  hero: { height: 280, justifyContent: 'flex-end' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0d0d14cc' },
  backBtn: { position: 'absolute', left: 16, zIndex: 10, width: 36, height: 36, backgroundColor: '#00000060', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  backText: { color: '#fff', fontSize: 20 },
  heroContent: { flexDirection: 'row', padding: 16, gap: 14, alignItems: 'flex-end' },
  cover: { width: 90, height: 135, borderRadius: 8 },
  coverPlaceholder: { width: 90, height: 135, borderRadius: 8, backgroundColor: '#1e1c2e', justifyContent: 'center', alignItems: 'center' },
  heroInfo: { flex: 1, gap: 6 },
  title: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24 },
  author: { fontSize: 13, color: '#a78bfa', fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  sourceLabel: { fontSize: 11, color: COLORS.dark.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', padding: 16, gap: 10 },
  readBtn: { flex: 2, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  readBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  libraryBtn: { flex: 1, backgroundColor: COLORS.dark.surface, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.dark.border },
  libraryBtnText: { color: COLORS.dark.textMid, fontWeight: '700', fontSize: 13 },
  chapterHeader: { backgroundColor: COLORS.dark.bg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border },
  chapterMeta: { gap: 2 },
  chapterCount: { fontSize: 15, fontWeight: '800', color: COLORS.dark.text },
  chapterStats: { fontSize: 12, color: COLORS.dark.textDim },
  chapterActions: { flexDirection: 'row', gap: 8 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: COLORS.dark.surface, borderRadius: 8 },
  sortBtnText: { color: COLORS.dark.textMid, fontSize: 12, fontWeight: '700' },
  dlBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#7c3aed20', borderRadius: 8 },
  dlBtnText: { color: '#a78bfa', fontSize: 12, fontWeight: '700' },
  descSection: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark.textMid, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 14, color: COLORS.dark.text, lineHeight: 22 },
  expandBtn: { color: '#7c3aed', fontWeight: '700', fontSize: 13 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.dark.surface, borderRadius: 20 },
  tagText: { color: COLORS.dark.textMid, fontSize: 12, fontWeight: '600' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border + '50' },
  chapterRowRead: { opacity: 0.45 },
  chapterRowLeft: { flex: 1, gap: 2 },
  chapterTitle: { fontSize: 14, color: COLORS.dark.text, fontWeight: '500' },
  chapterTitleRead: { color: COLORS.dark.textDim },
  chapterDate: { fontSize: 11, color: COLORS.dark.textDim },
  chapterRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  downloadedIcon: { fontSize: 12, color: '#7c3aed' },
  progressDot: { width: 8, height: 16, backgroundColor: COLORS.dark.surface, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  progressDotFill: { width: '100%', backgroundColor: '#7c3aed' },
});
