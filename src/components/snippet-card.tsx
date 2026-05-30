import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Snippet, toggleFavorite } from '@/services/database';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SnippetCardProps {
  snippet: Snippet;
  onFavoriteChange?: () => void;
}

export function SnippetCard({ snippet, onFavoriteChange }: SnippetCardProps) {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = () => {
    router.push({
      pathname: '/snippet/[id]' as any,
      params: { id: snippet.id },
    });
  };

  const handleFavoritePress = async (e: any) => {
    e.stopPropagation();
    try {
      await toggleFavorite(snippet.id);
      if (onFavoriteChange) {
        onFavoriteChange();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const formattedDate = new Date(snippet.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Take the first 3 lines of code for the preview
  const codeLines = snippet.code.split('\n');
  const codePreview = codeLines.slice(0, 3).join('\n') + (codeLines.length > 3 ? '\n...' : '');

  // Get a colored dot depending on the language
  const getLanguageColor = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === 'typescript' || l === 'ts') return '#3178c6';
    if (l === 'javascript' || l === 'js') return '#f1e05a';
    if (l === 'python' || l === 'py') return '#3572A5';
    if (l === 'go' || l === 'golang') return '#00ADD8';
    if (l === 'rust' || l === 'rs') return '#dea584';
    if (l === 'html') return '#e34c26';
    if (l === 'css') return '#563d7c';
    if (l === 'json') return '#00C853';
    return '#A0A4AA';
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.cardContainer, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleWrapper}>
            <View style={[styles.langDot, { backgroundColor: getLanguageColor(snippet.language) }]} />
            <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
              {snippet.title}
            </ThemedText>
          </View>
          <Pressable onPress={handleFavoritePress} style={styles.favoriteButton}>
            <SymbolView
              name={{
                ios: snippet.is_favorite ? 'star.fill' : 'star',
                android: snippet.is_favorite ? 'star' : 'star_border',
                web: snippet.is_favorite ? 'star' : 'star_border',
              }}
              tintColor={snippet.is_favorite ? '#FFD700' : theme.textSecondary}
              size={18}
            />
          </Pressable>
        </View>

        <View style={styles.codePreviewWrapper}>
          <ThemedText type="code" style={styles.codePreview} numberOfLines={3}>
            {codePreview}
          </ThemedText>
        </View>

        <View style={styles.footer}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.dateText}>
            {formattedDate}
          </ThemedText>
          <View style={styles.tagsContainer}>
            {snippet.tags.slice(0, 3).map((tag, index) => (
              <View key={`${tag}-${index}`} style={[styles.tagBadge, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="small" style={styles.tagText}>
                  #{tag}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: Spacing.one,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.two,
  },
  langDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.two,
  },
  title: {
    fontSize: 16,
    flex: 1,
  },
  favoriteButton: {
    padding: Spacing.one,
  },
  codePreviewWrapper: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  codePreview: {
    fontSize: 12,
    color: '#D0D4DA',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
  },
  tagBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
