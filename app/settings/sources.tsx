import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSourcesStore } from '@/store';
import { sourceRegistry, initSources } from '@/plugins';
import { COLORS } from '@/constants';

initSources();

export default function SourcesSettings() {
  const router = useRouter();
  const { enabled, toggleSource } = useSourcesStore();
  const sources = sourceRegistry.getAll();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sources</Text>
      </View>
      <FlatList
        data={sources}
        keyExtractor={s => s.info.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: source }) => (
          <View style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.sourceName}>{source.info.name}</Text>
              <Text style={styles.sourceMeta}>{source.info.lang.toUpperCase()} · v{source.info.version}</Text>
              {source.info.description && <Text style={styles.sourceDesc}>{source.info.description}</Text>}
              {source.info.isNsfw && <View style={styles.nsfwBadge}><Text style={styles.nsfwText}>18+</Text></View>}
            </View>
            <Switch
              value={enabled.includes(source.info.id)}
              onValueChange={() => toggleSource(source.info.id)}
              trackColor={{ true: '#7c3aed' }}
              thumbColor="#fff"
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { color: COLORS.dark.text, fontSize: 22 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.dark.text },
  list: { padding: 16, gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.dark.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.dark.border },
  info: { flex: 1, gap: 3 },
  sourceName: { fontSize: 15, fontWeight: '700', color: COLORS.dark.text },
  sourceMeta: { fontSize: 12, color: COLORS.dark.textDim },
  sourceDesc: { fontSize: 12, color: COLORS.dark.textMid },
  nsfwBadge: { alignSelf: 'flex-start', backgroundColor: '#ef444430', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  nsfwText: { color: '#f87171', fontSize: 10, fontWeight: '800' },
});
