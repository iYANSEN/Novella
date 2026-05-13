import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { getLibrary } from '@/utils/database';
import { useAppSettingsStore } from '@/store';
import { NovelCard } from '@/components/library/NovelCard';
import { COLORS } from '@/constants';
import type { ReadingStatus, Novel } from '@/types';

const READING_TABS: { value: ReadingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reading', label: 'Reading' },
  { value: 'plan_to_read', label: 'Plan to Read' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const { settings } = useAppSettingsStore();
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: library = [], isLoading, refetch } = useQuery({
    queryKey: ['library'],
    queryFn: getLibrary,
    staleTime: 30000,
  });

  const filtered = library
    .filter(n => activeTab === 'all' || n.readingStatus === activeTab)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.author ?? '').toLowerCase().includes(search.toLowerCase()));

  const handleNovelPress = useCallback((novel: Novel) => {
    router.push({ pathname: '/novel/[id]', params: { id: novel.id } });
  }, [router]);

  const columns = settings.gridColumns;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} style={styles.iconBtn}>
            <Text style={styles.iconText}>{viewMode === 'grid' ? '☰' : '⊞'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconBtn}>
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search library..."
          placeholderTextColor={COLORS.dark.textDim}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Tabs */}
      <FlatList
        horizontal
        data={READING_TABS}
        keyExtractor={t => t.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        renderItem={({ item: tab }) => {
          const count = tab.value === 'all'
            ? library.length
            : library.filter(n => n.readingStatus === tab.value).length;
          return (
            <TouchableOpacity
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tab, activeTab === tab.value && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab.value && styles.activeTabText]}>
                {tab.label} {count > 0 && `(${count})`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Content */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{library.length === 0 ? '📚' : '🔍'}</Text>
          <Text style={styles.emptyTitle}>{library.length === 0 ? 'Your library is empty' : 'No results'}</Text>
          <Text style={styles.emptyText}>
            {library.length === 0
              ? 'Browse sources to find novels and add them to your library'
              : 'Try a different search or filter'}
          </Text>
          {library.length === 0 && (
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/search')}>
              <Text style={styles.browseBtnText}>Browse Sources</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={n => n.id}
          numColumns={viewMode === 'grid' ? columns : 1}
          estimatedItemSize={viewMode === 'grid' ? 200 : 90}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#7c3aed" />}
          renderItem={({ item }) => (
            <View style={viewMode === 'grid' ? { paddingRight: 8, paddingBottom: 12 } : {}}>
              {viewMode === 'grid' ? (
                <NovelCard novel={item} onPress={() => handleNovelPress(item)} columns={columns} showProgress />
              ) : (
                // List view - reuse NovelCard in wider mode
                <NovelCard novel={item} onPress={() => handleNovelPress(item)} columns={1} showProgress />
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 20 },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: COLORS.dark.surface, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, color: COLORS.dark.text, fontSize: 15,
    borderWidth: 1, borderColor: COLORS.dark.border,
  },
  tabsContainer: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  // FIXED TAB STYLES – horizontal pills, no stretching
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 40,               // changed from 20
    backgroundColor: COLORS.dark.surface,
    height: 36,                     // fixed height
    alignSelf: 'flex-start',        // prevents stretching
    justifyContent: 'center',       // centers content vertically
  },
  activeTab: { backgroundColor: '#7c3aed' },
  tabText: {
    color: COLORS.dark.textMid,
    fontSize: 13,
    fontWeight: '500',              // changed from '600'
  },
  activeTabText: { color: '#fff' },
  listContent: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark.text },
  emptyText: { fontSize: 14, color: COLORS.dark.textMid, textAlign: 'center' },
  browseBtn: { marginTop: 8, backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
