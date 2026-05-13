import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useReaderStore } from '@/store';
import type { ReaderTheme, FontFamily, ScrollDirection } from '@/types';

interface Props {
  onClose: () => void;
  theme: { bg: string; text: string; ui: string; uiText: string };
}

export function ReaderSettingsPanel({ onClose, theme }: Props) {
  const { settings, updateSettings } = useReaderStore();

  const THEMES: { value: ReaderTheme; label: string; bg: string }[] = [
    { value: 'light', label: 'Light', bg: '#ffffff' },
    { value: 'sepia', label: 'Sepia', bg: '#f8f0e3' },
    { value: 'dark', label: 'Dark', bg: '#1a1a2e' },
    { value: 'amoled', label: 'AMOLED', bg: '#000000' },
  ];

  const FONTS: { value: FontFamily; label: string }[] = [
    { value: 'serif', label: 'Serif' },
    { value: 'sans', label: 'Sans' },
    { value: 'georgia', label: 'Georgia' },
    { value: 'palatino', label: 'Palatino' },
    { value: 'mono', label: 'Mono' },
  ];

  const SCROLL_MODES: { value: ScrollDirection; label: string; icon: string }[] = [
    { value: 'vertical', label: 'Vertical', icon: '↕' },
    { value: 'horizontal', label: 'Horizontal', icon: '↔' },
    { value: 'paged', label: 'Paged', icon: '⊟' },
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.overlay]}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[styles.panel, { backgroundColor: theme.ui }]}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Theme */}
          <Section label="Theme" theme={theme}>
            <View style={styles.row}>
              {THEMES.map(t => (
                <TouchableOpacity key={t.value} onPress={() => updateSettings({ theme: t.value })}
                  style={[styles.themeBtn, { backgroundColor: t.bg }, settings.theme === t.value && styles.selectedTheme]}>
                  <Text style={{ fontSize: 11, color: t.value === 'light' ? '#333' : '#eee', fontWeight: '600' }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Font */}
          <Section label="Font" theme={theme}>
            <View style={styles.row}>
              {FONTS.map(f => (
                <TouchableOpacity key={f.value} onPress={() => updateSettings({ fontFamily: f.value })}
                  style={[styles.fontBtn, { borderColor: settings.fontFamily === f.value ? '#7c3aed' : theme.uiText + '30' }]}>
                  <Text style={{ fontFamily: f.value, color: theme.uiText, fontSize: 13, fontWeight: settings.fontFamily === f.value ? '700' : '400' }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Size */}
          <Section label={`Font Size: ${settings.fontSize}px`} theme={theme}>
            <Slider value={settings.fontSize} min={12} max={32} step={1} theme={theme}
              onChange={v => updateSettings({ fontSize: v })} />
          </Section>

          {/* Line height */}
          <Section label={`Line Spacing: ${settings.lineHeight.toFixed(1)}`} theme={theme}>
            <Slider value={settings.lineHeight} min={1.2} max={3.0} step={0.1} theme={theme}
              onChange={v => updateSettings({ lineHeight: parseFloat(v.toFixed(1)) })} />
          </Section>

          {/* Margins */}
          <Section label={`Margins: ${settings.marginHorizontal}px`} theme={theme}>
            <Slider value={settings.marginHorizontal} min={8} max={64} step={4} theme={theme}
              onChange={v => updateSettings({ marginHorizontal: v })} />
          </Section>

          {/* Paragraph spacing */}
          <Section label={`Paragraph Spacing: ${settings.paragraphSpacing}px`} theme={theme}>
            <Slider value={settings.paragraphSpacing} min={4} max={48} step={2} theme={theme}
              onChange={v => updateSettings({ paragraphSpacing: v })} />
          </Section>

          {/* Text align */}
          <Section label="Text Align" theme={theme}>
            <View style={styles.row}>
              {(['left', 'justify', 'right'] as const).map(a => (
                <TouchableOpacity key={a} onPress={() => updateSettings({ textAlign: a })}
                  style={[styles.alignBtn, { borderColor: settings.textAlign === a ? '#7c3aed' : theme.uiText + '30', backgroundColor: settings.textAlign === a ? '#7c3aed20' : 'transparent' }]}>
                  <Text style={{ color: settings.textAlign === a ? '#7c3aed' : theme.uiText, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Scroll direction */}
          <Section label="Scroll Mode" theme={theme}>
            <View style={styles.row}>
              {SCROLL_MODES.map(m => (
                <TouchableOpacity key={m.value} onPress={() => updateSettings({ scrollDirection: m.value })}
                  style={[styles.modeBtn, { borderColor: settings.scrollDirection === m.value ? '#7c3aed' : theme.uiText + '30', backgroundColor: settings.scrollDirection === m.value ? '#7c3aed20' : 'transparent' }]}>
                  <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                  <Text style={{ color: settings.scrollDirection === m.value ? '#7c3aed' : theme.uiText, fontSize: 11, fontWeight: '600' }}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Auto scroll */}
          <Section label="Auto Scroll" theme={theme}>
            <ToggleRow label="Enable auto-scroll" value={settings.autoScrollEnabled} theme={theme}
              onChange={v => updateSettings({ autoScrollEnabled: v })} />
            {settings.autoScrollEnabled && (
              <>
                <Text style={[styles.subLabel, { color: theme.uiText + '99' }]}>Speed: {settings.autoScrollSpeed}</Text>
                <Slider value={settings.autoScrollSpeed} min={1} max={10} step={1} theme={theme}
                  onChange={v => updateSettings({ autoScrollSpeed: v })} />
              </>
            )}
          </Section>

          {/* TTS settings */}
          <Section label="Text to Speech" theme={theme}>
            <Text style={[styles.subLabel, { color: theme.uiText + '99' }]}>Speed: {settings.ttsSpeed.toFixed(1)}x</Text>
            <Slider value={settings.ttsSpeed} min={0.5} max={2.0} step={0.1} theme={theme}
              onChange={v => updateSettings({ ttsSpeed: parseFloat(v.toFixed(1)) })} />
            <Text style={[styles.subLabel, { color: theme.uiText + '99', marginTop: 8 }]}>Pitch: {settings.ttsPitch.toFixed(1)}</Text>
            <Slider value={settings.ttsPitch} min={0.5} max={2.0} step={0.1} theme={theme}
              onChange={v => updateSettings({ ttsPitch: parseFloat(v.toFixed(1)) })} />
          </Section>

          {/* Misc */}
          <Section label="Display" theme={theme}>
            <ToggleRow label="Keep screen on" value={settings.keepScreenOn} theme={theme}
              onChange={v => updateSettings({ keepScreenOn: v })} />
            <ToggleRow label="Full screen" value={settings.fullscreen} theme={theme}
              onChange={v => updateSettings({ fullscreen: v })} />
            <ToggleRow label="Show progress bar" value={settings.showProgressBar} theme={theme}
              onChange={v => updateSettings({ showProgressBar: v })} />
          </Section>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

function Section({ label, children, theme }: { label: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.uiText + '88' }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange, theme }: { label: string; value: boolean; onChange: (v: boolean) => void; theme: any }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: theme.uiText }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#7c3aed' }} thumbColor="#fff" />
    </View>
  );
}

function Slider({ value, min, max, step, onChange, theme }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; theme: any }) {
  const steps = Math.round((max - min) / step);
  const currentStep = Math.round((value - min) / step);

  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity onPress={() => onChange(Math.max(min, value - step))} style={[styles.sliderBtn, { backgroundColor: theme.uiText + '20' }]}>
        <Text style={{ color: theme.uiText, fontSize: 16, fontWeight: '700' }}>−</Text>
      </TouchableOpacity>
      <View style={[styles.sliderTrack, { backgroundColor: theme.uiText + '30' }]}>
        <View style={[styles.sliderFill, { width: `${(currentStep / steps) * 100}%` }]} />
      </View>
      <TouchableOpacity onPress={() => onChange(Math.min(max, value + step))} style={[styles.sliderBtn, { backgroundColor: theme.uiText + '20' }]}>
        <Text style={{ color: theme.uiText, fontSize: 16, fontWeight: '700' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { justifyContent: 'flex-end', zIndex: 200 },
  backdrop: { flex: 1, backgroundColor: '#00000060' },
  panel: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%' },
  handle: { width: 36, height: 4, backgroundColor: '#ffffff40', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  themeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', minWidth: 60 },
  selectedTheme: { borderWidth: 2, borderColor: '#7c3aed' },
  fontBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1.5, minWidth: 56 },
  alignBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1.5 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1.5, gap: 2 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  toggleLabel: { fontSize: 14, fontWeight: '500' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sliderTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 3 },
  subLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
});
