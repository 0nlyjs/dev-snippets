import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, FlatList, Alert, Image, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { 
  listDirectoryContents, 
  deleteLocalFile, 
  shareLocalFile, 
  seedTemplates,
  FileItemInfo,
  SNIPPETS_DIR,
  SCREENSHOTS_DIR,
  TEMPLATES_DIR
} from '@/services/filesystem';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SandboxFolder = 'snippets' | 'screenshots' | 'templates' | 'root';

export default function FileManagerScreen() {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  
  const [currentFolder, setCurrentFolder] = useState<SandboxFolder>('root');
  const [files, setFiles] = useState<FileItemInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const getFolderPath = (folder: SandboxFolder): string => {
    if (folder === 'snippets') return SNIPPETS_DIR;
    if (folder === 'screenshots') return SCREENSHOTS_DIR;
    if (folder === 'templates') return TEMPLATES_DIR;
    return '';
  };

  const loadFiles = async (folder: SandboxFolder) => {
    if (folder === 'root') {
      setFiles([]);
      return;
    }
    try {
      setLoading(true);
      const path = getFolderPath(folder);
      const contents = await listDirectoryContents(path);
      setFiles(contents);
    } catch (error) {
      console.error('Failed to load directory files:', error);
      Alert.alert('Error', 'Could not open folder.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentFolder);
  }, [currentFolder]);

  const handleFolderPress = (folder: SandboxFolder) => {
    setCurrentFolder(folder);
  };

  const handleBackToRoot = () => {
    setCurrentFolder('root');
  };

  const handleShareFile = async (item: FileItemInfo) => {
    try {
      await shareLocalFile(item.uri);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Sharing is not available.');
    }
  };

  const handleDeleteFile = (item: FileItemInfo) => {
    Alert.alert(
      'Delete Local File',
      `Are you sure you want to permanently delete "${item.name}" from your device's storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocalFile(item.uri);
              loadFiles(currentFolder); // refresh
            } catch (e) {
              Alert.alert('Error', 'Could not delete file.');
            }
          }
        }
      ]
    );
  };

  const handleRefreshTemplates = async () => {
    try {
      setLoading(true);
      await seedTemplates();
      if (currentFolder === 'templates') {
        await loadFiles('templates');
      }
      Alert.alert('Success', 'Templates re-seeded successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'ts') return 'curlybraces';
    if (ext === 'json') return 'text.justify.left';
    if (ext === 'txt') return 'doc.text';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return 'photo';
    return 'doc';
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.innerContainer, { paddingTop: safeAreaInsets.top }]}>
        {/* Header Title */}
        <View style={styles.header}>
          <View>
            <ThemedText type="subtitle" style={styles.brandTitle}>
              File Manager
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Browse sandboxed device assets
            </ThemedText>
          </View>
          {currentFolder === 'templates' && (
            <Pressable 
              onPress={handleRefreshTemplates}
              style={({ pressed }) => [styles.syncButton, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                tintColor={theme.text}
                size={14}
              />
              <ThemedText type="smallBold">Reset Templates</ThemedText>
            </Pressable>
          )}
        </View>

        {currentFolder === 'root' ? (
          /* Folder Roots Grid */
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rootGrid}>
            <Pressable
              onPress={() => handleFolderPress('snippets')}
              style={({ pressed }) => [styles.folderCard, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }, pressed && styles.pressed]}>
              <View style={[styles.folderIconWrapper, { backgroundColor: 'rgba(2, 132, 245, 0.1)' }]}>
                <SymbolView
                  name={{ ios: 'folder.fill', android: 'folder', web: 'folder' }}
                  tintColor="#0284F5"
                  size={32}
                />
              </View>
              <ThemedText type="smallBold" style={styles.folderName}>
                Snippets Exports
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.folderDesc}>
                Exported JS, JSON, and TXT codes.
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handleFolderPress('screenshots')}
              style={({ pressed }) => [styles.folderCard, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }, pressed && styles.pressed]}>
              <View style={[styles.folderIconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <SymbolView
                  name={{ ios: 'photo.on.rectangle.angled.fill', android: 'photo_library', web: 'photo_library' }}
                  tintColor="#4CAF50"
                  size={32}
                />
              </View>
              <ThemedText type="smallBold" style={styles.folderName}>
                Attached Images
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.folderDesc}>
                Screenshot references captured local.
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handleFolderPress('templates')}
              style={({ pressed }) => [styles.folderCard, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }, pressed && styles.pressed]}>
              <View style={[styles.folderIconWrapper, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
                <SymbolView
                  name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
                  tintColor="#FFC107"
                  size={32}
                />
              </View>
              <ThemedText type="smallBold" style={styles.folderName}>
                Resource Templates
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.folderDesc}>
                Pre-seeded cheatsheets & boilerplates.
              </ThemedText>
            </Pressable>
          </ScrollView>
        ) : (
          /* Folder Contents List */
          <View style={styles.filesListContainer}>
            <Pressable onPress={handleBackToRoot} style={({ pressed }) => [styles.backHeader, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                tintColor="#0284F5"
                size={16}
              />
              <ThemedText type="smallBold" style={styles.backHeaderText}>
                Back to Folders / {currentFolder.toUpperCase()}
              </ThemedText>
            </Pressable>

            <FlatList
              data={files}
              keyExtractor={(item) => item.uri}
              contentContainerStyle={[
                styles.flatListContainer, 
                { paddingBottom: BottomTabInset + Spacing.six },
                files.length === 0 && styles.listEmptyContainer
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(item.name.split('.').pop()?.toLowerCase() || '');
                return (
                  <View style={[styles.fileRow, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }]}>
                    <View style={styles.fileIconTextWrapper}>
                      {isImage ? (
                        <Image source={{ uri: item.uri }} style={styles.fileThumbnail} />
                      ) : (
                        <View style={[styles.smallIconWrapper, { backgroundColor: theme.backgroundSelected }]}>
                          <SymbolView
                            name={{ 
                              ios: getFileIcon(item.name), 
                              android: 'insert_drive_file', 
                              web: 'insert_drive_file' 
                            }}
                            tintColor={theme.text}
                            size={16}
                          />
                        </View>
                      )}
                      
                      <View style={styles.fileDetails}>
                        <ThemedText type="smallBold" style={styles.fileNameText} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.fileSizeText}>
                          {formatSize(item.size)}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.fileActions}>
                      <Pressable onPress={() => handleShareFile(item)} style={styles.actionIconButton}>
                        <SymbolView
                          name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                          tintColor="#0284F5"
                          size={16}
                        />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteFile(item)} style={styles.actionIconButton}>
                        <SymbolView
                          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                          tintColor="#FF3B30"
                          size={16}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <SymbolView
                    name={{ ios: 'folder.badge.minus', android: 'folder_open', web: 'folder_open' }}
                    tintColor={theme.textSecondary}
                    size={36}
                  />
                  <ThemedText type="smallBold" style={styles.emptyTitle}>
                    {loading ? 'Reading folder...' : 'Folder is Empty'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
                    {currentFolder === 'snippets' 
                      ? 'Create and export snippets as files from the details panel.' 
                      : currentFolder === 'screenshots' 
                        ? 'Photos attached to code snippets will display here.'
                        : 'No boilerplates exist in this category.'}
                  </ThemedText>
                </View>
              }
            />
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
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
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  rootGrid: {
    gap: Spacing.four,
    paddingVertical: Spacing.two,
  },
  folderCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.08)',
  },
  folderIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  folderName: {
    fontSize: 16,
    marginBottom: Spacing.one,
  },
  folderDesc: {
    fontSize: 12,
  },
  filesListContainer: {
    flex: 1,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  backHeaderText: {
    fontSize: 13,
    color: '#0284F5',
  },
  flatListContainer: {
    paddingTop: Spacing.one,
    flexGrow: 1,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginVertical: Spacing.one,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.05)',
  },
  fileIconTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.two,
  },
  smallIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileThumbnail: {
    width: 36,
    height: 36,
    borderRadius: Spacing.two,
    resizeMode: 'cover',
    backgroundColor: '#000000',
  },
  fileDetails: {
    marginLeft: Spacing.three,
    flex: 1,
  },
  fileNameText: {
    fontSize: 13.5,
  },
  fileSizeText: {
    fontSize: 11,
    marginTop: 2,
  },
  fileActions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  listEmptyContainer: {
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  emptyTitle: {
    fontSize: 16,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});
