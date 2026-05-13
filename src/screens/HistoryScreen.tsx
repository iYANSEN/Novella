import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHistory, clearHistory } from '@/utils/database';
import { COLORS } from '@/constants';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function HistoryScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => getHistory(100),
    staleTime: 10000,
  });

  const clearMutation = useMutation({
    mutationFn: clearHistory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  });

  const handleClear = () => {
    Alert.alert('Clear History', 'Remove all reading history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearMutation.mutate() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🕮</Text>
          <Text style={styles.emptyTitle}>No reading history</Text>
          <Text style={styles.emptyText}>Novels you read will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, i) => `${item.novel_id}_${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push({ pathname: '/novel/[id]', params: { id: item.novel_id } })}
              activeOpacity={0.75}
            >
              <View style={styles.cover}>
                {item.cover_url ? (
                  <Image source={{ uri: item.cover_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                ) : (
                  <Text style={styles.coverPlaceholder}>🕮</Text>
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.novelTitle} numberOfLines={1}>{item.novel_title}</Text>
                <Text style={styles.chapterTitle} numberOfLines={1}>{item.chapter_title}</Text>
                <Text style={styles.time}>{dayjs(item.read_at).fromNow()}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.dark.surface, borderRadius: 8 },
  clearBtnText: { color: '#f87171', fontSize: 13, fontWeight: '700' },
  list: { padding: 16, gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.dark.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.dark.border },
  cover: { width: 48, height: 72, borderRadius: 6, backgroundColor: COLORS.dark.surface, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  coverPlaceholder: { fontSize: 22 },
  info: { flex: 1, gap: 3 },
  novelTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark.text },
  chapterTitle: { fontSize: 12, color: COLORS.dark.textMid },
  time: { fontSize: 11, color: COLORS.dark.textDim },
  arrow: { fontSize: 20, color: COLORS.dark.textDim },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark.text },
  emptyText: { fontSize: 14, color: COLORS.dark.textMid },
});
