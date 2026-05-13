import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDownloadsStore } from '@/store';
import { useDownloadManager } from '@/hooks/useDownloadManager';
import { COLORS } from '@/constants';
import type { DownloadTask } from '@/types';

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  downloading: '#7c3aed',
  completed: '#10b981',
  failed: '#ef4444',
  paused: '#6b7280',
};

export default function DownloadsScreen() {
  const { queue } = useDownloadsStore();
  const { retryFailed, cancelDownload } = useDownloadManager();

  const pending = queue.filter(t => t.status === 'pending').length;
  const active = queue.filter(t => t.status === 'downloading').length;
  const failed = queue.filter(t => t.status === 'failed').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Downloads</Text>

      {/* Stats */}
      <View style={styles.stats}>
        <StatChip label="Active" value={active} color="#7c3aed" />
        <StatChip label="Pending" value={pending} color="#f59e0b" />
        <StatChip label="Failed" value={failed} color="#ef4444" />
      </View>

      {failed > 0 && (
        <TouchableOpacity style={styles.retryAllBtn} onPress={retryFailed}>
          <Text style={styles.retryAllText}>↺ Retry All Failed</Text>
        </TouchableOpacity>
      )}

      {queue.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⬇︎</Text>
          <Text style={styles.emptyTitle}>No downloads</Text>
          <Text style={styles.emptyText}>Download chapters from the novel page to read offline</Text>
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: task }) => <DownloadItem task={task} onCancel={() => cancelDownload(task.id)} />}
        />
      )}
    </SafeAreaView>
  );
}

function DownloadItem({ task, onCancel }: { task: DownloadTask; onCancel: () => void }) {
  const color = STATUS_COLOR[task.status] ?? '#6b7280';
  return (
    <View style={styles.item}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNovel} numberOfLines={1}>{task.novelTitle}</Text>
        <Text style={styles.itemChapter} numberOfLines={1}>{task.chapterTitle}</Text>
        {task.status === 'downloading' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${task.progress * 100}%` }]} />
          </View>
        )}
        {task.error && <Text style={styles.errorText}>{task.error}</Text>}
      </View>
      <View style={styles.itemRight}>
        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.statusText, { color }]}>{task.status}</Text>
        </View>
        {['pending', 'downloading', 'failed'].includes(task.status) && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: color + '15', borderColor: color + '40' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: color + 'cc' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text, paddingHorizontal: 16, paddingBottom: 12 },
  stats: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statChip: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700' },
  retryAllBtn: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#ef444420', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ef444440' },
  retryAllText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 8 },
  item: { backgroundColor: COLORS.dark.card, borderRadius: 12, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.dark.border },
  itemInfo: { flex: 1, gap: 3 },
  itemNovel: { fontSize: 13, fontWeight: '700', color: COLORS.dark.text },
  itemChapter: { fontSize: 12, color: COLORS.dark.textMid },
  progressBar: { height: 3, backgroundColor: COLORS.dark.border, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: '#7c3aed' },
  errorText: { fontSize: 11, color: '#f87171', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cancelBtn: { width: 22, height: 22, backgroundColor: COLORS.dark.surface, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: COLORS.dark.textMid, fontSize: 14, lineHeight: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark.text },
  emptyText: { fontSize: 14, color: COLORS.dark.textMid, textAlign: 'center' },
});
