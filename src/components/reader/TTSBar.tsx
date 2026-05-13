import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

interface Props {
  onStop: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  currentIndex: number;
  theme: { bg: string; text: string; ui: string; uiText: string };
  insets: EdgeInsets;
}

export function TTSBar({ onStop, onSkipBack, onSkipForward, currentIndex, theme, insets }: Props) {
  return (
    <View style={[styles.bar, { backgroundColor: theme.ui, paddingBottom: insets.bottom + 8 }]}>
      <TouchableOpacity onPress={onSkipBack} style={styles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.icon, { color: theme.uiText }]}>⏮</Text>
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={[styles.label, { color: theme.uiText }]}>🔊 Reading aloud</Text>
        <Text style={[styles.sub, { color: theme.uiText + '88' }]}>Paragraph {currentIndex + 1}</Text>
      </View>
      <TouchableOpacity onPress={onSkipForward} style={styles.btn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.icon, { color: theme.uiText }]}>⏭</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onStop} style={[styles.stopBtn]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Stop</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, gap: 10,
    zIndex: 50,
  },
  btn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700' },
  sub: { fontSize: 11, marginTop: 1 },
  stopBtn: { backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
});
