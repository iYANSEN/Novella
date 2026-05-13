import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import type { Novel } from '@/types';

const { width: SW } = Dimensions.get('window');

interface Props {
  novel: Partial<Novel>;
  onPress: () => void;
  columns?: number;
  showProgress?: boolean;
}

export function NovelCard({ novel, onPress, columns = 3, showProgress = false }: Props) {
  const cardWidth = (SW - 16 * 2 - (columns - 1) * 8) / columns;
  const cardHeight = cardWidth * 1.5;

  const progress = novel.chaptersRead && novel.totalChapters
    ? novel.chaptersRead / novel.totalChapters
    : 0;

  return (
    <TouchableOpacity style={[styles.card, { width: cardWidth }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.coverContainer, { height: cardHeight }]}>
        {novel.coverUrl || novel.coverLocal ? (
          <Image
            source={{ uri: novel.coverLocal || novel.coverUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📖</Text>
          </View>
        )}
        {/* Status badge */}
        {novel.status && novel.status !== 'unknown' && (
          <View style={[styles.statusBadge, { backgroundColor: novel.status === 'completed' ? '#10b98199' : '#7c3aed99' }]}>
            <Text style={styles.statusText}>{novel.status === 'completed' ? 'Done' : novel.status === 'hiatus' ? 'Hiatus' : 'Ongoing'}</Text>
          </View>
        )}
        {/* Download indicator */}
        {novel.inLibrary && (
          <View style={styles.libraryDot} />
        )}
        {/* Progress overlay */}
        {showProgress && progress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{novel.title}</Text>
      {novel.author && <Text style={styles.author} numberOfLines={1}>{novel.author}</Text>}
    </TouchableOpacity>
  );
}

// List variant (wider cards for library view)
export function NovelListItem({ novel, onPress }: { novel: Partial<Novel>; onPress: () => void }) {
  const progress = novel.chaptersRead && novel.totalChapters
    ? Math.round((novel.chaptersRead / novel.totalChapters) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.listCover}>
        {novel.coverUrl || novel.coverLocal ? (
          <Image source={{ uri: novel.coverLocal || novel.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { flex: 1 }]}>
            <Text style={styles.placeholderIcon}>📖</Text>
          </View>
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={2}>{novel.title}</Text>
        {novel.author && <Text style={styles.listAuthor} numberOfLines={1}>{novel.author}</Text>}
        <View style={styles.listMeta}>
          {novel.chaptersRead !== undefined && novel.totalChapters && (
            <Text style={styles.listProgress}>{novel.chaptersRead}/{novel.totalChapters} ch</Text>
          )}
          {novel.readingStatus && (
            <View style={[styles.readingBadge, { backgroundColor: STATUS_COLORS[novel.readingStatus] + '30' }]}>
              <Text style={[styles.readingBadgeText, { color: STATUS_COLORS[novel.readingStatus] }]}>
                {STATUS_LABELS[novel.readingStatus]}
              </Text>
            </View>
          )}
        </View>
        {progress > 0 && (
          <View style={styles.listProgressBar}>
            <View style={[styles.listProgressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const STATUS_COLORS: Record<string, string> = {
  reading: '#7c3aed',
  plan_to_read: '#3b82f6',
  completed: '#10b981',
  dropped: '#ef4444',
  on_hold: '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
  reading: 'Reading',
  plan_to_read: 'Plan to read',
  completed: 'Completed',
  dropped: 'Dropped',
  on_hold: 'On hold',
};

const styles = StyleSheet.create({
  card: { gap: 4 },
  coverContainer: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#1e1c2e' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1c2e' },
  placeholderIcon: { fontSize: 28 },
  statusBadge: { position: 'absolute', top: 4, right: 4, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  libraryDot: { position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#7c3aed' },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#00000040' },
  progressFill: { height: '100%', backgroundColor: '#7c3aed' },
  title: { color: '#f0eeff', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  author: { color: '#9b95c4', fontSize: 10 },
  // List styles
  listItem: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#16151f', borderRadius: 12, marginBottom: 8 },
  listCover: { width: 60, height: 90, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1e1c2e' },
  listInfo: { flex: 1, gap: 3 },
  listTitle: { color: '#f0eeff', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  listAuthor: { color: '#9b95c4', fontSize: 12 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  listProgress: { color: '#4e4a6b', fontSize: 11 },
  readingBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  readingBadgeText: { fontSize: 10, fontWeight: '700' },
  listProgressBar: { height: 3, backgroundColor: '#2a2840', borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  listProgressFill: { height: '100%', backgroundColor: '#7c3aed' },
});
