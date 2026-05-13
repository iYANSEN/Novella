import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {focused && <View style={styles.tabDot} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.dark.card,
          borderTopColor: COLORS.dark.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📚" label="Library" focused={focused} /> }}
      />
      <Tabs.Screen
        name="browse"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔍" label="Browse" focused={focused} /> }}
      />
      <Tabs.Screen
        name="updates"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Updates" focused={focused} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="☰" label="More" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, width: 56 },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: COLORS.dark.textDim, fontWeight: '600' },
  tabLabelActive: { color: '#a78bfa' },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#7c3aed', marginTop: 1 },
});
