import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, FlatList, Pressable, ScrollView, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SnippetCard } from '@/components/snippet-card';
import { searchSnippets, Snippet } from '@/services/database';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PREDEFINED_LANGUAGES = ['All', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'HTML', 'CSS', 'JSON'];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const results = await searchSnippets(searchQuery, selectedLanguage);
      setSnippets(results);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically refresh when screen focuses or search query / selected language changes
  useFocusEffect(
    useCallback(() => {
      fetchSnippets();
    }, [searchQuery, selectedLanguage])
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleCreateSnippetPress = () => {
    router.push('/create' as any);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Title */}
        <View style={styles.header}>
          <View>
            <ThemedText type="subtitle" style={styles.brandTitle}>
              DevSnippets
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your offline-first code notebook
            </ThemedText>
          </View>
          <Pressable 
            onPress={handleCreateSnippetPress} 
            style={({ pressed }) => [styles.createIconButton, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={theme.text}
              size={20}
            />
          </Pressable>
        </View>

        {/* Search Field */}
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement }]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={theme.textSecondary}
            size={16}
          />
          <TextInput
            placeholder="Search snippets, codes, tags..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} style={styles.clearSearchButton}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor={theme.textSecondary}
                size={16}
              />
            </Pressable>
          )}
        </View>

        {/* Languages Selector */}
        <View style={styles.languagesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languagesScroll}
            style={styles.languagesContainer}>
            {PREDEFINED_LANGUAGES.map((lang) => {
              const isActive = selectedLanguage === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => setSelectedLanguage(lang)}
                  style={({ pressed }) => [
                    styles.languageBadge,
                    isActive 
                      ? { backgroundColor: '#0284F5' } 
                      : { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.languageBadgeText,
                      isActive ? { color: '#FFFFFF' } : { color: theme.textSecondary },
                    ]}>
                    {lang}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Snippets List */}
        <FlatList
          data={snippets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <SnippetCard snippet={item} onFavoriteChange={fetchSnippets} />
          )}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: BottomTabInset + Spacing.four },
            snippets.length === 0 && styles.listEmptyContainer
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundElement }]}>
                <SymbolView
                  name={{ ios: 'doc.text.magnifyingglass', android: 'find_in_page', web: 'find_in_page' }}
                  tintColor={theme.textSecondary}
                  size={36}
                />
              </View>
              <ThemedText type="smallBold" style={styles.emptyTitle}>
                {loading ? 'Searching local DB...' : 'No Snippets Saved'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                {searchQuery || selectedLanguage !== 'All'
                  ? 'Try modifying your search queries or language filters.'
                  : 'Start cataloging your development resources now.'}
              </ThemedText>
              {!searchQuery && selectedLanguage === 'All' && !loading && (
                <Pressable
                  onPress={handleCreateSnippetPress}
                  style={({ pressed }) => [styles.emptyCreateButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.emptyCreateButtonText}>
                    Create Your First Snippet
                  </ThemedText>
                </Pressable>
              )}
            </View>
          }
        />
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
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one,
    marginVertical: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.two,
    fontFamily: 'normal',
  },
  clearSearchButton: {
    padding: Spacing.one,
  },
  languagesWrapper: {
    marginVertical: Spacing.two,
  },
  languagesContainer: {
    flexDirection: 'row',
  },
  languagesScroll: {
    gap: Spacing.two,
    paddingRight: Spacing.six,
  },
  languageBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.05)',
  },
  languageBadgeText: {
    fontSize: 12,
  },
  listContainer: {
    paddingTop: Spacing.one,
    flexGrow: 1,
  },
  listEmptyContainer: {
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
    maxWidth: 260,
  },
  emptyCreateButton: {
    backgroundColor: '#0284F5',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  emptyCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});
