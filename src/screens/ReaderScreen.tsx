import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, StatusBar,
  Dimensions, ActivityIndicator, Platform, BackHandler,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useReaderStore } from '@/store';
import { READER_THEMES, FONT_FAMILIES } from '@/constants';
import {
  getChapter, getChapters, getNovel, markChapterRead,
  saveReadingPosition, getReadingPosition, addToHistory,
} from '@/utils/database';
import { getChapterContentOfflineFirst } from '@/hooks/useDownloadManager';
import { parseChapterContent, buildReaderHtml } from '@/utils/contentParser';
import { useTTS } from '@/hooks/useTTS';
import type { Chapter, Novel } from '@/types';
import { ReaderSettingsPanel } from '@/components/reader/ReaderSettingsPanel';
import { ReaderMenu } from '@/components/reader/ReaderMenu';
import { TTSBar } from '@/components/reader/TTSBar';

const { width: SW } = Dimensions.get('window');

export default function ReaderScreen() {
  const { novelId, chapterId } = useLocalSearchParams<{ novelId: string; chapterId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, setAutoScrollActive } = useReaderStore();
  const tts = useTTS();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [htmlDoc, setHtmlDoc] = useState<string>('');

  const webViewRef = useRef<WebView>(null);
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef(Date.now());
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const theme = READER_THEMES[settings.theme] || READER_THEMES.dark;

  // Load chapter data
  useEffect(() => {
    loadChapter();
    return () => {
      if (settings.keepScreenOn) deactivateKeepAwake();
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
      tts.stopTTS();
    };
  }, [chapterId]);

  useEffect(() => {
    if (settings.keepScreenOn) activateKeepAwakeAsync();
    return () => { if (settings.keepScreenOn) deactivateKeepAwake(); };
  }, [settings.keepScreenOn]);

  // Hardware back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsVisible) { setSettingsVisible(false); return true; }
      if (menuVisible) { hideMenu(); return true; }
      handleExit();
      return true;
    });
    return () => handler.remove();
  }, [menuVisible, settingsVisible]);

  // Auto-scroll
  useEffect(() => {
    if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    if (settings.autoScrollEnabled && !loading) {
      const speed = (11 - settings.autoScrollSpeed) * 50; // ms per step
      autoScrollTimerRef.current = setInterval(() => {
        webViewRef.current?.injectJavaScript('window.scrollBy(0, 1); true;');
      }, speed);
      setAutoScrollActive(true);
    } else {
      setAutoScrollActive(false);
    }
    return () => { if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current); };
  }, [settings.autoScrollEnabled, settings.autoScrollSpeed, loading]);

  // Rebuild HTML when settings change
  useEffect(() => {
    if (content) buildAndSetHtml(content);
  }, [settings.theme, settings.fontFamily, settings.fontSize, settings.lineHeight,
    settings.marginHorizontal, settings.marginVertical, settings.paragraphSpacing,
    settings.textAlign, settings.fontWeight, content]);

  const loadChapter = async () => {
    if (!chapterId || !novelId) return;
    setLoading(true);
    setError(null);
    try {
      const [ch, nov, chList] = await Promise.all([
        getChapter(chapterId),
        getNovel(novelId),
        getChapters(novelId),
      ]);
      if (!ch || !nov) throw new Error('Chapter or novel not found');

      setChapter(ch);
      setNovel(nov);
      setChapters(chList);
      const idx = chList.findIndex(c => c.id === chapterId);
      setCurrentIndex(idx);

      // Fetch content (offline first)
      const rawContent = await getChapterContentOfflineFirst(ch.id, ch.chapterPath, ch.sourceId);
      const parsed = parseChapterContent(rawContent);
      setContent(parsed.html);
      tts.setParagraphs(parsed.paragraphs);

      buildAndSetHtml(parsed.html);

      // Restore scroll position
      const pos = await getReadingPosition(novelId);
      if (pos?.chapterId === chapterId && pos.position > 0) {
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(`window.restorePosition(${pos.position}); true;`);
        }, 600);
      }

      // History
      await addToHistory({
        novelId, chapterId, novelTitle: nov.title, chapterTitle: ch.title, coverUrl: nov.coverUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const buildAndSetHtml = (rawContent: string) => {
    const fontFamily = FONT_FAMILIES[settings.fontFamily] ?? 'serif';
    const html = buildReaderHtml(rawContent, {
      theme: settings.theme,
      bg: theme.bg,
      textColor: theme.text,
      fontFamily: fontFamily || 'serif',
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      marginH: settings.marginHorizontal,
      marginV: settings.marginVertical,
      paragraphSpacing: settings.paragraphSpacing,
      textAlign: settings.textAlign,
      fontWeight: settings.fontWeight,
    });
    setHtmlDoc(html);
  };

  const showMenu = () => {
    setMenuVisible(true);
    Animated.timing(menuOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const hideMenu = () => {
    Animated.timing(menuOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setMenuVisible(false));
  };

  const handleTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (menuVisible) hideMenu();
    else showMenu();
  }, [menuVisible]);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'scroll') {
        setScrollProgress(msg.position);
        saveReadingPosition({ novelId: novelId!, chapterId: chapterId!, position: msg.position, updatedAt: Date.now() });
        // Mark as read when 90% done
        if (msg.position > 0.9 && chapter && !chapter.isRead) {
          markChapterRead(chapterId!, novelId!);
          setChapter(c => c ? { ...c, isRead: true } : c);
        }
      } else if (msg.type === 'selection') {
        // Future: dictionary lookup or bookmark creation
      }
    } catch {}
  }, [novelId, chapterId, chapter]);

  const goToChapter = async (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= chapters.length) return;
    const nextChapter = chapters[newIndex];
    await saveReadingPosition({ novelId: novelId!, chapterId: chapterId!, position: scrollProgress, updatedAt: Date.now() });
    router.replace({ pathname: '/reader/[novelId]/[chapterId]', params: { novelId: novelId!, chapterId: nextChapter.id } });
  };

  const handleExit = async () => {
    await saveReadingPosition({ novelId: novelId!, chapterId: chapterId!, position: scrollProgress, updatedAt: Date.now() });
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    // Update reading history with duration
    router.back();
  };

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar hidden={settings.fullscreen} barStyle={settings.theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={theme.bg} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading chapter...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadChapter}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={handleTap}>
          <WebView
            ref={webViewRef}
            source={{ html: htmlDoc }}
            style={{ flex: 1, backgroundColor: theme.bg }}
            onMessage={handleWebViewMessage}
            scrollEnabled
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            bounces={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']}
          />
        </TouchableOpacity>
      )}

      {/* Progress bar */}
      {settings.showProgressBar && !loading && (
        <View style={[styles.progressBar, { top: settings.fullscreen ? 0 : insets.top }]}>
          <View style={[styles.progressFill, { width: `${scrollProgress * 100}%` }]} />
        </View>
      )}

      {/* Menu overlay */}
      {menuVisible && (
        <ReaderMenu
          opacity={menuOpacity}
          chapter={chapter}
          novel={novel}
          hasPrev={hasPrev}
          hasNext={hasNext}
          progress={scrollProgress}
          currentIndex={currentIndex}
          totalChapters={chapters.length}
          onPrev={() => goToChapter('prev')}
          onNext={() => goToChapter('next')}
          onBack={handleExit}
          onSettings={() => { hideMenu(); setSettingsVisible(true); }}
          onTTS={() => { hideMenu(); tts.isActive ? tts.stopTTS() : tts.startTTS(); }}
          ttsActive={tts.isActive}
          theme={theme}
          insets={insets}
        />
      )}

      {/* Settings panel */}
      {settingsVisible && (
        <ReaderSettingsPanel onClose={() => setSettingsVisible(false)} theme={theme} />
      )}

      {/* TTS bar */}
      {tts.isActive && (
        <TTSBar
          onStop={tts.stopTTS}
          onSkipBack={tts.skipBack}
          onSkipForward={tts.skipForward}
          currentIndex={tts.currentIndex}
          theme={theme}
          insets={insets}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  errorText: { color: '#f87171', fontSize: 15, textAlign: 'center' },
  retryBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  progressBar: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'transparent', zIndex: 10 },
  progressFill: { height: '100%', backgroundColor: '#7c3aed' },
});
