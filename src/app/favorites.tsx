import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SnippetCard } from '@/components/snippet-card';
import { getFavoriteSnippets, Snippet } from '@/services/database';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const results = await getFavoriteSnippets();
      setSnippets(results);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const handleBrowsePress = () => {
    router.push('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Title */}
        <View style={styles.header}>
          <View>
            <ThemedText type="subtitle" style={styles.brandTitle}>
              Favorites
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your bookmarked code blocks
            </ThemedText>
          </View>
        </View>

        {/* Snippets List */}
        <FlatList
          data={snippets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <SnippetCard snippet={item} onFavoriteChange={fetchFavorites} />
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
                  name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                  tintColor="#FFD700"
                  size={36}
                />
              </View>
              <ThemedText type="smallBold" style={styles.emptyTitle}>
                {loading ? 'Reading database...' : 'No Bookmarked Snippets'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                Add snippets to your favorites by tapping the star icon in any code card.
              </ThemedText>
              {!loading && (
                <Pressable
                  onPress={handleBrowsePress}
                  style={({ pressed }) => [styles.browseButton, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.browseButtonText}>
                    Browse Snippets
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
    paddingVertical: Spacing.three,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
  browseButton: {
    backgroundColor: '#0284F5',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
