import React from 'react';
import { Animated, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { Chapter, Novel } from '@/types';

interface Props {
  opacity: Animated.Value;
  chapter: Chapter | null;
  novel: Novel | null;
  hasPrev: boolean;
  hasNext: boolean;
  progress: number;
  currentIndex: number;
  totalChapters: number;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onSettings: () => void;
  onTTS: () => void;
  ttsActive: boolean;
  theme: { bg: string; text: string; ui: string; uiText: string };
  insets: EdgeInsets;
}

export function ReaderMenu({ opacity, chapter, novel, hasPrev, hasNext, progress, currentIndex, totalChapters, onPrev, onNext, onBack, onSettings, onTTS, ttsActive, theme, insets }: Props) {
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity }]} pointerEvents="box-none">
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: theme.ui, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.iconText, { color: theme.uiText }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={[styles.novelTitle, { color: theme.uiText }]} numberOfLines={1}>{novel?.title}</Text>
          <Text style={[styles.chapterTitle, { color: theme.uiText + '99' }]} numberOfLines={1}>{chapter?.title}</Text>
        </View>
        <TouchableOpacity onPress={onSettings} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.iconText, { color: theme.uiText }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.ui, paddingBottom: insets.bottom + 8 }]}>
        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: theme.uiText + '99' }]}>
            {currentIndex + 1} / {totalChapters}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: theme.uiText + '30' }]}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.uiText + '99' }]}>{Math.round(progress * 100)}%</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={onPrev}
            style={[styles.navBtn, { backgroundColor: hasPrev ? '#7c3aed' : theme.uiText + '20', opacity: hasPrev ? 1 : 0.4 }]}
            disabled={!hasPrev}
          >
            <Text style={styles.navBtnText}>‹ Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onTTS} style={[styles.ttsBtn, { backgroundColor: ttsActive ? '#7c3aed' : theme.uiText + '20' }]}>
            <Text style={{ color: ttsActive ? '#fff' : theme.uiText, fontSize: 18 }}>🔊</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            style={[styles.navBtn, { backgroundColor: hasNext ? '#7c3aed' : theme.uiText + '20', opacity: hasNext ? 1 : 0.4 }]}
            disabled={!hasNext}
          >
            <Text style={styles.navBtnText}>Next ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { justifyContent: 'space-between', zIndex: 100 },
  topBar: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22, fontWeight: '400' },
  titleBlock: { flex: 1 },
  novelTitle: { fontSize: 13, fontWeight: '700' },
  chapterTitle: { fontSize: 12, marginTop: 1 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { fontSize: 12, fontWeight: '600', minWidth: 32, textAlign: 'center' },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 2 },
  controls: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  navBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  navBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ttsBtn: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
});
