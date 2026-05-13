import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getReadingStats, getLibrary } from '@/utils/database';
import { COLORS } from '@/constants';

export default function StatsScreen() {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: getReadingStats, staleTime: 30000 });
  const { data: library = [] } = useQuery({ queryKey: ['library'], queryFn: getLibrary, staleTime: 30000 });

  const readingNovels = library.filter(n => n.readingStatus === 'reading').length;
  const completedNovels = library.filter(n => n.readingStatus === 'completed').length;
  const estimatedHours = stats ? Math.round((stats.estimatedWordsRead / 250) / 60) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Reading Stats</Text>

        {/* Main stats */}
        <View style={styles.grid}>
          <StatCard icon="📖" label="Chapters Read" value={stats?.totalChaptersRead ?? 0} color="#7c3aed" />
          <StatCard icon="📚" label="Novels Started" value={stats?.totalNovelsStarted ?? 0} color="#3b82f6" />
          <StatCard icon="✅" label="Completed" value={stats?.totalNovelsCompleted ?? 0} color="#10b981" />
          <StatCard icon="📅" label="Reading Days" value={stats?.totalReadingDays ?? 0} color="#f59e0b" />
          <StatCard icon="💬" label="Words Read" value={formatNumber(stats?.estimatedWordsRead ?? 0)} color="#ec4899" large />
          <StatCard icon="⏱️" label="Est. Hours" value={estimatedHours} color="#8b5cf6" />
        </View>

        {/* Library breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library</Text>
          <View style={styles.breakdownList}>
            <BreakdownRow label="Currently reading" value={readingNovels} color="#7c3aed" total={library.length} />
            <BreakdownRow label="Completed" value={completedNovels} color="#10b981" total={library.length} />
            <BreakdownRow label="Plan to read" value={library.filter(n => n.readingStatus === 'plan_to_read').length} color="#3b82f6" total={library.length} />
            <BreakdownRow label="On hold" value={library.filter(n => n.readingStatus === 'on_hold').length} color="#f59e0b" total={library.length} />
            <BreakdownRow label="Dropped" value={library.filter(n => n.readingStatus === 'dropped').length} color="#ef4444" total={library.length} />
          </View>
        </View>

        {/* Reading pace */}
        {stats && stats.totalChaptersRead > 0 && stats.totalReadingDays > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reading Pace</Text>
            <View style={styles.paceCard}>
              <PaceStat
                label="Chapters / day"
                value={(stats.totalChaptersRead / Math.max(1, stats.totalReadingDays)).toFixed(1)}
              />
              <View style={styles.paceDivider} />
              <PaceStat
                label="Avg words / chapter"
                value={stats.totalChaptersRead > 0 ? formatNumber(Math.round(stats.estimatedWordsRead / stats.totalChaptersRead)) : '–'}
              />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color, large }: { icon: string; label: string; value: number | string; color: string; large?: boolean }) {
  return (
    <View style={[styles.statCard, large && styles.statCardLarge, { borderColor: color + '30' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BreakdownRow({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <View style={styles.breakdownBar}>
        <View style={[styles.breakdownFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.breakdownValue, { color }]}>{value}</Text>
    </View>
  );
}

function PaceStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.paceStat}>
      <Text style={styles.paceValue}>{value}</Text>
      <Text style={styles.paceLabel}>{label}</Text>
    </View>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: COLORS.dark.card, borderRadius: 14, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1 },
  statCardLarge: { width: '100%' },
  statIcon: { fontSize: 28 },
  statValue: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  statLabel: { fontSize: 12, color: COLORS.dark.textMid, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.dark.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  breakdownList: { backgroundColor: COLORS.dark.card, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, borderColor: COLORS.dark.border },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownLabel: { width: 110, fontSize: 13, color: COLORS.dark.text, fontWeight: '500' },
  breakdownBar: { flex: 1, height: 6, backgroundColor: COLORS.dark.surface, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 3 },
  breakdownValue: { width: 28, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  paceCard: { backgroundColor: COLORS.dark.card, borderRadius: 14, padding: 20, flexDirection: 'row', borderWidth: 1, borderColor: COLORS.dark.border },
  paceStat: { flex: 1, alignItems: 'center', gap: 4 },
  paceDivider: { width: 1, backgroundColor: COLORS.dark.border, marginHorizontal: 16 },
  paceValue: { fontSize: 28, fontWeight: '900', color: COLORS.dark.text },
  paceLabel: { fontSize: 12, color: COLORS.dark.textMid, fontWeight: '600', textAlign: 'center' },
});
