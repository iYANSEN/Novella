import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookmarks, deleteBookmark, updateBookmarkNote } from '@/utils/database';
import { COLORS } from '@/constants';
import type { Bookmark, BookmarkColor } from '@/types';
import dayjs from 'dayjs';

const COLOR_MAP: Record<BookmarkColor, string> = {
  yellow: '#fbbf24', green: '#34d399', blue: '#60a5fa', pink: '#f472b6', purple: '#a78bfa',
};

export default function BookmarksScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => getBookmarks(),
    staleTime: 10000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => updateBookmarkNote(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
      setEditingBookmark(null);
    },
  });

  const handleDelete = (bookmark: Bookmark) => {
    Alert.alert('Delete Bookmark', 'Remove this bookmark?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(bookmark.id) },
    ]);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setNoteText(bookmark.note ?? '');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Bookmarks</Text>

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyText}>Long-press text in the reader to bookmark passages</Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={b => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: bm }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/reader/[novelId]/[chapterId]', params: { novelId: bm.novelId, chapterId: bm.chapterId } })}
              activeOpacity={0.75}
            >
              <View style={[styles.colorBar, { backgroundColor: COLOR_MAP[bm.color ?? 'yellow'] }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitles}>
                    <Text style={styles.novelTitle} numberOfLines={1}>{bm.novelTitle}</Text>
                    <Text style={styles.chapterTitle} numberOfLines={1}>{bm.chapterTitle}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleEdit(bm)} style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(bm)} style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.excerpt, { borderLeftColor: COLOR_MAP[bm.color ?? 'yellow'] }]} numberOfLines={3}>
                  {bm.selectedText}
                </Text>
                {bm.note ? (
                  <Text style={styles.note}>📝 {bm.note}</Text>
                ) : null}
                <Text style={styles.date}>{dayjs(bm.createdAt).format('MMM D, YYYY · h:mm A')}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Edit note modal */}
      <Modal visible={!!editingBookmark} transparent animationType="slide" onRequestClose={() => setEditingBookmark(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setEditingBookmark(null)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Note</Text>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add a note..."
              placeholderTextColor={COLORS.dark.textDim}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditingBookmark(null)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => editingBookmark && noteMutation.mutate({ id: editingBookmark.id, note: noteText })}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text, paddingHorizontal: 16, paddingBottom: 12 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: COLORS.dark.card, borderRadius: 12, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: COLORS.dark.border },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: 12, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitles: { flex: 1 },
  novelTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark.text },
  chapterTitle: { fontSize: 11, color: COLORS.dark.textDim },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 4 },
  actionIcon: { fontSize: 14 },
  excerpt: { fontSize: 13, color: COLORS.dark.textMid, lineHeight: 20, borderLeftWidth: 2, paddingLeft: 8, fontStyle: 'italic' },
  note: { fontSize: 12, color: '#a78bfa', fontWeight: '500' },
  date: { fontSize: 11, color: COLORS.dark.textDim },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark.text },
  emptyText: { fontSize: 14, color: COLORS.dark.textMid, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' },
  modalPanel: { backgroundColor: COLORS.dark.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHandle: { width: 36, height: 4, backgroundColor: COLORS.dark.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.dark.text, marginBottom: 14 },
  noteInput: { backgroundColor: COLORS.dark.surface, borderRadius: 10, padding: 12, color: COLORS.dark.text, fontSize: 14, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.dark.border },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.dark.surface },
  modalCancelText: { color: COLORS.dark.textMid, fontWeight: '700' },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#7c3aed' },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});
