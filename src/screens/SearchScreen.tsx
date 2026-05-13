import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { sourceRegistry, initSources } from '@/plugins';
import { upsertNovel } from '@/utils/database';
import { NovelCard } from '@/components/library/NovelCard';
import { COLORS, GENRES } from '@/constants';
import type { SearchFilters, Novel, NovelStatus } from '@/types';

initSources();

const SOURCES = sourceRegistry.getAll();

export default function SearchScreen() {
  const router = useRouter();
  const { query: initQuery, sourceId: initSource } = useLocalSearchParams<{ query?: string; sourceId?: string }>();

  const [query, setQuery] = useState(initQuery ?? '');
  const [selectedSource, setSelectedSource] = useState(initSource ?? SOURCES[0]?.info.id ?? '');
  const [mode, setMode] = useState<'search' | 'popular' | 'latest'>('popular');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<NovelStatus | undefined>();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const source = sourceRegistry.get(selectedSource);

  const filters: SearchFilters = {
    query: mode === 'search' ? query : undefined,
    status: statusFilter,
    genres: selectedGenres,
    page,
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['browse', selectedSource, mode, filters],
    queryFn: async () => {
      if (!source) throw new Error('Source not available');
      if (mode === 'search' && query.trim()) return source.search(filters);
      if (mode === 'latest') return source.getLatestUpdates(page);
      return source.getPopular(page);
    },
    enabled: !!source && (mode !== 'search' || query.length > 1),
    staleTime: 60000,
  });

  const handleNovelPress = useCallback(async (novel: Partial<Novel>) => {
    if (!novel.id || !novel.sourceId || !novel.novelPath || !novel.title || !novel.url) return;
    // Cache the novel
    await upsertNovel(novel as any);
    router.push({ pathname: '/novel/[id]', params: { id: novel.id } });
  }, [router]);

  const handleSearch = () => {
    if (query.trim().length < 2) return;
    setMode('search');
    setPage(1);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(g => g.includes(genre) ? g.filter(x => x !== genre) : [...g, genre]);
  };

  const novels = data?.novels ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search novels..."
            placeholderTextColor={COLORS.dark.textDim}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={!initQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setMode('popular'); }} style={styles.clearBtn}>
              <Text style={{ color: COLORS.dark.textDim, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowFilters(f => !f)} style={[styles.filterBtn, showFilters && styles.filterBtnActive]}>
          <Text style={{ fontSize: 16 }}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Source picker */}
      <FlatList
        horizontal
        data={SOURCES}
        keyExtractor={s => s.info.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sourcesRow}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            onPress={() => { setSelectedSource(s.info.id); setPage(1); }}
            style={[styles.sourceChip, selectedSource === s.info.id && styles.sourceChipActive]}
          >
            <Text style={[styles.sourceChipText, selectedSource === s.info.id && styles.sourceChipTextActive]}>
              {s.info.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Mode tabs */}
      <View style={styles.modeTabs}>
        {(['popular', 'latest', 'search'] as const).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => { setMode(m); if (m !== 'search') setPage(1); }}
            style={[styles.modeTab, mode === m && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
              {m === 'popular' ? '✦︎ Popular' : m === 'latest' ? '❕ Latest' : '🔍︎ Search'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterSectionLabel}>STATUS</Text>
          <View style={styles.filterRow}>
            {(['ongoing', 'completed', 'hiatus'] as const).map(s => (
              <TouchableOpacity key={s} onPress={() => setStatusFilter(f => f === s ? undefined : s)}
                style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.filterSectionLabel, { marginTop: 10 }]}>GENRES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {GENRES.slice(0, 16).map(g => (
                <TouchableOpacity key={g} onPress={() => toggleGenre(g)}
                  style={[styles.filterChip, selectedGenres.includes(g) && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, selectedGenres.includes(g) && styles.filterChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❕ {(error as Error).message}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : novels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{mode === 'search' ? '🔍︎' : '🗒'}</Text>
          <Text style={styles.emptyText}>
            {mode === 'search' && query ? 'No results found' : 'Start searching or browse above'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={novels}
          keyExtractor={(_, i) => `novel_${i}`}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NovelCard novel={item} onPress={() => handleNovelPress(item)} columns={3} />
          )}
          ListFooterComponent={
            hasNextPage ? (
              <View style={styles.pagination}>
                {page > 1 && (
                  <TouchableOpacity style={styles.pageBtn} onPress={() => setPage(p => Math.max(1, p - 1))}>
                    <Text style={styles.pageBtnText}>‹ Prev</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.pageNum}>Page {page}</Text>
                <TouchableOpacity style={styles.pageBtn} onPress={() => setPage(p => p + 1)}>
                  <Text style={styles.pageBtnText}>Next ›</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { color: COLORS.dark.text, fontSize: 22 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.surface, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.dark.border },
  searchInput: { flex: 1, color: COLORS.dark.text, fontSize: 15, paddingVertical: 10 },
  clearBtn: { padding: 4 },
  filterBtn: { width: 36, height: 36, backgroundColor: COLORS.dark.surface, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.dark.border },
  filterBtnActive: { backgroundColor: '#7c3aed30', borderColor: '#7c3aed' },
  sourcesRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  sourceChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.dark.surface, borderWidth: 1, borderColor: COLORS.dark.border },
  sourceChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  sourceChipText: { color: COLORS.dark.textMid, fontSize: 13, fontWeight: '600' },
  sourceChipTextActive: { color: '#fff' },
  modeTabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.dark.surface, alignItems: 'center' },
  modeTabActive: { backgroundColor: '#7c3aed20', borderWidth: 1, borderColor: '#7c3aed' },
  modeTabText: { color: COLORS.dark.textMid, fontSize: 12, fontWeight: '700' },
  modeTabTextActive: { color: '#a78bfa' },
  filtersPanel: { marginHorizontal: 16, backgroundColor: COLORS.dark.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.dark.border },
  filterSectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.dark.textDim, letterSpacing: 1.2, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: COLORS.dark.bg, borderWidth: 1, borderColor: COLORS.dark.border },
  filterChipActive: { backgroundColor: '#7c3aed30', borderColor: '#7c3aed' },
  filterChipText: { color: COLORS.dark.textMid, fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#a78bfa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 60 },
  emptyIcon: { fontSize: 42 },
  emptyText: { color: COLORS.dark.textMid, fontSize: 14, textAlign: 'center' },
  grid: { padding: 16, paddingTop: 4 },
  gridRow: { gap: 8, marginBottom: 12 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 20 },
  pageBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8 },
  pageBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pageNum: { color: COLORS.dark.textMid, fontSize: 14, fontWeight: '600' },
});
