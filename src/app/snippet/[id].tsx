import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CodeView } from '@/components/code-view';
import { getSnippetById, deleteSnippet, toggleFavorite, updateSnippet, Snippet } from '@/services/database';
import { saveSnippetToFile, shareLocalFile, deleteLocalFile } from '@/services/filesystem';
import { generateSnippetExplanation } from '@/services/ai';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SnippetDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const snippetId = parseInt(id as string, 10);

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'ai'>('code');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const loadSnippet = async () => {
    try {
      setLoading(true);
      const data = await getSnippetById(snippetId);
      if (data) {
        setSnippet(data);
        setAiExplanation(data.explanation || null);
      } else {
        Alert.alert('Error', 'Snippet not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load snippet details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnippet();
  }, [snippetId]);

  const handleFavoriteToggle = async () => {
    if (!snippet) return;
    try {
      const updated = await toggleFavorite(snippet.id);
      setSnippet(updated);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleEdit = () => {
    if (!snippet) return;
    router.push({
      pathname: '/create' as any,
      params: { id: snippet.id },
    });
  };

  const handleDelete = () => {
    if (!snippet) return;
    Alert.alert(
      'Delete Snippet',
      'Are you sure you want to permanently delete this code snippet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (snippet.screenshot_path) {
                await deleteLocalFile(snippet.screenshot_path);
              }
              await deleteSnippet(snippet.id);
              Alert.alert('Success', 'Snippet deleted.');
              router.back();
            } catch (error) {
              console.error('Failed to delete snippet:', error);
              Alert.alert('Error', 'Could not delete snippet.');
            }
          },
        },
      ]
    );
  };

  const handleExport = () => {
    if (!snippet) return;
    Alert.alert(
      'Export Format',
      'Choose a file format to export and save this snippet locally:',
      [
        { text: 'Text (.txt)', onPress: () => triggerExport('txt') },
        { text: 'JavaScript (.js)', onPress: () => triggerExport('js') },
        { text: 'JSON (.json)', onPress: () => triggerExport('json') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const triggerExport = async (ext: 'txt' | 'js' | 'json') => {
    if (!snippet) return;
    try {
      const fileUri = await saveSnippetToFile(snippet.title, snippet.code, ext);
      Alert.alert(
        'Export Successful',
        `Saved successfully as ${ext.toUpperCase()} to your documents folder!\n\nDo you want to share this file?`,
        [
          { text: 'No, Keep Local' },
          { text: 'Share File', onPress: () => shareLocalFile(fileUri) }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Export Failed', 'An error occurred while saving the file.');
    }
  };

  const handleGenerateAI = async () => {
    if (!snippet) return;
    try {
      setAiLoading(true);
      const explanation = await generateSnippetExplanation(snippet.code, snippet.language, snippet.title);
      setAiExplanation(explanation.fullMarkdown);
      
      // Cache explanations directly into SQLite!
      const updated = await updateSnippet(snippet.id, {
        explanation: explanation.fullMarkdown,
      });
      setSnippet(updated);
    } catch (error) {
      console.error('Failed to generate AI explanation:', error);
      Alert.alert('AI Error', 'Could not generate explanation. Verify keys in Settings.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearAICache = async () => {
    if (!snippet) return;
    try {
      setAiLoading(true);
      const updated = await updateSnippet(snippet.id, { explanation: null });
      setSnippet(updated);
      setAiExplanation(null);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284F5" />
      </ThemedView>
    );
  }

  if (!snippet) return null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={theme.text}
              size={20}
            />
          </Pressable>
          
          <View style={styles.headerActions}>
            <Pressable onPress={handleFavoriteToggle} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <SymbolView
                name={{
                  ios: snippet.is_favorite ? 'star.fill' : 'star',
                  android: snippet.is_favorite ? 'star' : 'star_border',
                  web: snippet.is_favorite ? 'star' : 'star_border',
                }}
                tintColor={snippet.is_favorite ? '#FFD700' : theme.text}
                size={20}
              />
            </Pressable>
            <Pressable onPress={handleEdit} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
                tintColor={theme.text}
                size={20}
              />
            </Pressable>
            <Pressable onPress={handleDelete} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                tintColor="#FF3B30"
                size={20}
              />
            </Pressable>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <ThemedText type="subtitle" style={styles.snippetTitle}>
            {snippet.title}
          </ThemedText>
          <View style={styles.metaRow}>
            <View style={[styles.langBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold" style={styles.langText}>
                {snippet.language}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Created {new Date(snippet.created_at).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>

        {/* Dynamic Tabs Bar */}
        <View style={[styles.tabsBar, { borderBottomColor: theme.backgroundSelected }]}>
          <Pressable 
            onPress={() => setActiveTab('code')}
            style={[styles.tabButton, activeTab === 'code' && [styles.activeTab, { borderBottomColor: '#0284F5' }]]}>
            <ThemedText type="smallBold" themeColor={activeTab === 'code' ? 'text' : 'textSecondary'}>
              Code Block
            </ThemedText>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('ai')}
            style={[styles.tabButton, activeTab === 'ai' && [styles.activeTab, { borderBottomColor: '#0284F5' }]]}>
            <ThemedText type="smallBold" themeColor={activeTab === 'ai' ? 'text' : 'textSecondary'}>
              AI Assistant
            </ThemedText>
          </Pressable>
        </View>

        {/* Active Tab View */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.five }]}>
          
          {activeTab === 'code' ? (
            <View style={styles.tabContent}>
              {/* Code Viewer */}
              <CodeView code={snippet.code} language={snippet.language} />
              
              {/* Actions panel */}
              <View style={styles.actionsPanel}>
                <Pressable
                  onPress={handleExport}
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                    tintColor={theme.text}
                    size={16}
                  />
                  <ThemedText type="smallBold">Export & Share</ThemedText>
                </Pressable>
              </View>

              {/* Screenshot Attachment display */}
              {snippet.screenshot_path && (
                <View style={styles.screenshotSection}>
                  <ThemedText type="smallBold" style={styles.sectionLabel}>
                    Reference Screenshot
                  </ThemedText>
                  <Image source={{ uri: snippet.screenshot_path }} style={styles.screenshotImage} />
                </View>
              )}

              {/* Tags Horizontal Display */}
              {snippet.tags.length > 0 && (
                <View style={styles.tagsSection}>
                  <ThemedText type="smallBold" style={styles.sectionLabel}>
                    Category Tags
                  </ThemedText>
                  <View style={styles.tagsContainer}>
                    {snippet.tags.map((tag) => (
                      <View key={tag} style={[styles.tagBadge, { backgroundColor: theme.backgroundSelected }]}>
                        <ThemedText type="small" style={styles.tagText}>
                          #{tag}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {/* AI Explanation Tab */}
              {aiExplanation ? (
                <View style={styles.aiExplanationWrapper}>
                  <View style={[styles.aiExplanationCard, { backgroundColor: theme.backgroundElement }]}>
                    <View style={styles.aiCardHeader}>
                      <View style={styles.aiLabelRow}>
                        <SymbolView
                          name={{ ios: 'cpu', android: 'memory', web: 'memory' }}
                          tintColor="#0284F5"
                          size={18}
                        />
                        <ThemedText type="smallBold" style={styles.aiModelLabel}>
                          AI Analysis Results
                        </ThemedText>
                      </View>
                      
                      <Pressable onPress={handleClearAICache} style={styles.refreshAiButton}>
                        <SymbolView
                          name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                          tintColor={theme.textSecondary}
                          size={14}
                        />
                        <ThemedText type="small" themeColor="textSecondary">
                          Re-analyze
                        </ThemedText>
                      </Pressable>
                    </View>

                    {/* Markdown display */}
                    <View style={styles.aiMarkdownContent}>
                      <ThemedText type="small" style={styles.aiMarkdownText}>
                        {aiExplanation}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.aiPromptContainer}>
                  <View style={[styles.aiPromptIconCircle, { backgroundColor: theme.backgroundElement }]}>
                    <SymbolView
                      name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                      tintColor="#0284F5"
                      size={36}
                    />
                  </View>
                  
                  <ThemedText type="smallBold" style={styles.aiPromptTitle}>
                    AI Code Explanation
                  </ThemedText>
                  
                  <ThemedText type="small" themeColor="textSecondary" style={styles.aiPromptSubtitle}>
                    Generate a fully-typed breakdown, runtime summaries, and specific optimization recommendations for this code snippet.
                  </ThemedText>

                  <Pressable
                    onPress={handleGenerateAI}
                    disabled={aiLoading}
                    style={({ pressed }) => [
                      styles.aiGenerateButton,
                      aiLoading && { opacity: 0.7 },
                      pressed && styles.pressed
                    ]}>
                    {aiLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <SymbolView
                          name={{ ios: 'cpu', android: 'memory', web: 'memory' }}
                          tintColor="#FFFFFF"
                          size={16}
                        />
                        <ThemedText type="smallBold" style={styles.aiGenerateText}>
                          Analyze with AI
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  titleSection: {
    paddingVertical: Spacing.two,
  },
  snippetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  langBadge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one - 2,
    borderRadius: 6,
  },
  langText: {
    fontSize: 11,
    color: '#0284F5',
  },
  tabsBar: {
    flexDirection: 'row',
    marginTop: Spacing.three,
    borderBottomWidth: 1.5,
  },
  tabButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginRight: Spacing.two,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2.5,
  },
  scrollContent: {
    paddingTop: Spacing.three,
  },
  tabContent: {
    gap: Spacing.four,
  },
  actionsPanel: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.08)',
  },
  screenshotSection: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  screenshotImage: {
    width: '100%',
    height: 220,
    borderRadius: Spacing.three,
    resizeMode: 'contain',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  tagsSection: {
    gap: Spacing.two,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  tagBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
  },
  aiPromptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  aiPromptIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  aiPromptTitle: {
    fontSize: 18,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  aiPromptSubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.five,
    maxWidth: 280,
    lineHeight: 20,
  },
  aiGenerateButton: {
    backgroundColor: '#0284F5',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 180,
    justifyContent: 'center',
  },
  aiGenerateText: {
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  aiExplanationWrapper: {
    marginTop: Spacing.one,
  },
  aiExplanationCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.08)',
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
    paddingBottom: Spacing.two,
    marginBottom: Spacing.three,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  aiModelLabel: {
    fontSize: 14,
  },
  refreshAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  aiMarkdownContent: {
    paddingVertical: Spacing.one,
  },
  aiMarkdownText: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'sans-serif', default: 'sans-serif' }),
  },
});
