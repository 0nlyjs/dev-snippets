import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Platform, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createSnippet, getSnippetById, updateSnippet } from '@/services/database';
import { saveScreenshot, deleteLocalFile } from '@/services/filesystem';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const POPULAR_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'HTML', 'CSS', 'JSON', 'SQL', 'Bash'];

export default function CreateOrEditSnippetScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const snippetId = params.id ? parseInt(params.id as string, 10) : null;

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [customLanguage, setCustomLanguage] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (snippetId) {
      setIsEditMode(true);
      loadExistingSnippet(snippetId);
    } else {
      setIsEditMode(false);
      setTitle('');
      setCode('');
      setLanguage('TypeScript');
      setCustomLanguage('');
      setTagsStr('');
      setScreenshotUri(null);
    }
  }, [snippetId]);

  const loadExistingSnippet = async (id: number) => {
    try {
      setLoading(true);
      const snippet = await getSnippetById(id);
      if (snippet) {
        setTitle(snippet.title);
        setCode(snippet.code);
        
        if (POPULAR_LANGUAGES.includes(snippet.language)) {
          setLanguage(snippet.language);
          setCustomLanguage('');
        } else {
          setLanguage('Other');
          setCustomLanguage(snippet.language);
        }
        
        setTagsStr(snippet.tags.join(', '));
        setScreenshotUri(snippet.screenshot_path || null);
      } else {
        Alert.alert('Error', 'Snippet not found.');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load snippet for editing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickScreenshot = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant photo library access to attach screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const tempUri = result.assets[0].uri;
        setLoading(true);
        // Save permanently in the FS sandboxed screenshot folder
        const savedUri = await saveScreenshot(tempUri);
        setScreenshotUri(savedUri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Could not pick screenshot.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveScreenshot = async () => {
    if (screenshotUri) {
      try {
        await deleteLocalFile(screenshotUri);
      } catch (e) {
        console.warn('Failed to delete file from disk during remove:', e);
      }
      setScreenshotUri(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title.');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Please enter the code content.');
      return;
    }

    const finalLanguage = language === 'Other' ? customLanguage.trim() || 'Other' : language;
    const parsedTags = tagsStr
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    try {
      setLoading(true);
      if (isEditMode && snippetId) {
        await updateSnippet(snippetId, {
          title: title.trim(),
          code: code.trim(),
          language: finalLanguage,
          tags: parsedTags,
          screenshot_path: screenshotUri,
        });
        Alert.alert('Success', 'Snippet updated successfully!');
      } else {
        await createSnippet({
          title: title.trim(),
          code: code.trim(),
          language: finalLanguage,
          tags: parsedTags,
          screenshot_path: screenshotUri,
        });
        Alert.alert('Success', 'Snippet saved offline!');
      }
      
      // Go back to previous screen (details or home)
      router.back();
    } catch (error) {
      console.error('Failed to save snippet:', error);
      Alert.alert('Error', 'Failed to save snippet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOtherLanguage = language === 'Other';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Title */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={theme.text}
              size={20}
            />
          </Pressable>
          <ThemedText type="subtitle" style={styles.brandTitle}>
            {isEditMode ? 'Edit Snippet' : 'New Snippet'}
          </ThemedText>
          <Pressable 
            onPress={handleSave} 
            disabled={loading}
            style={({ pressed }) => [
              styles.saveButton, 
              loading && { opacity: 0.5 },
              pressed && styles.pressed
            ]}>
            <ThemedText type="smallBold" style={styles.saveButtonText}>
              Save
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.formContainer, { paddingBottom: BottomTabInset + Spacing.six }]}>
          
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Title
            </ThemedText>
            <TextInput
              placeholder="e.g. Fetch API helper, Flexbox Layout"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          {/* Language Selector */}
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Language
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
              {POPULAR_LANGUAGES.map((lang) => {
                const isSelected = language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => {
                      setLanguage(lang);
                      setCustomLanguage('');
                    }}
                    style={[
                      styles.langBadge,
                      isSelected ? { backgroundColor: '#0284F5' } : { backgroundColor: theme.backgroundElement }
                    ]}>
                    <ThemedText type="small" style={[styles.langBadgeText, isSelected && { color: '#FFFFFF' }]}>
                      {lang}
                    </ThemedText>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setLanguage('Other')}
                style={[
                  styles.langBadge,
                  isOtherLanguage ? { backgroundColor: '#0284F5' } : { backgroundColor: theme.backgroundElement }
                ]}>
                <ThemedText type="small" style={[styles.langBadgeText, isOtherLanguage && { color: '#FFFFFF' }]}>
                  Custom
                </ThemedText>
              </Pressable>
            </ScrollView>

            {isOtherLanguage && (
              <TextInput
                placeholder="Enter custom programming language"
                placeholderTextColor={theme.textSecondary}
                value={customLanguage}
                onChangeText={setCustomLanguage}
                style={[styles.input, styles.customLangInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            )}
          </View>

          {/* Code Input */}
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Code Content
            </ThemedText>
            <TextInput
              placeholder="// Write your code here..."
              placeholderTextColor={theme.textSecondary}
              value={code}
              onChangeText={setCode}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                styles.codeEditor,
                { 
                  color: '#D0D4DA', 
                  backgroundColor: '#151618',
                  fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' })
                }
              ]}
            />
          </View>

          {/* Tags Input */}
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Tags
            </ThemedText>
            <TextInput
              placeholder="e.g. react-native, fetch, api (comma separated)"
              placeholderTextColor={theme.textSecondary}
              value={tagsStr}
              onChangeText={setTagsStr}
              autoCapitalize="none"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          {/* Screenshot Attachment */}
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold" style={styles.label}>
              Attached Screenshot
            </ThemedText>
            
            {screenshotUri ? (
              <View style={styles.screenshotPreviewWrapper}>
                <Image source={{ uri: screenshotUri }} style={styles.screenshotPreview} />
                <Pressable
                  onPress={handleRemoveScreenshot}
                  style={styles.removeScreenshotButton}>
                  <SymbolView
                    name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                    tintColor="#FF3B30"
                    size={16}
                  />
                  <ThemedText type="smallBold" style={styles.removeScreenshotText}>
                    Remove Image
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickScreenshot}
                style={({ pressed }) => [styles.addScreenshotButton, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                <SymbolView
                  name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                  tintColor={theme.textSecondary}
                  size={20}
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.addScreenshotText}>
                  Attach Screenshot / Reference Image
                </ThemedText>
              </Pressable>
            )}
          </View>

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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#0284F5',
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
  formContainer: {
    gap: Spacing.four,
    paddingTop: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two + 2 : Spacing.two,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.08)',
  },
  customLangInput: {
    marginTop: Spacing.one,
  },
  langScroll: {
    gap: Spacing.two,
    paddingRight: Spacing.four,
  },
  langBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.05)',
  },
  langBadgeText: {
    fontSize: 12,
  },
  codeEditor: {
    height: 250,
    textAlignVertical: 'top',
    fontSize: 12.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  addScreenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(150, 150, 150, 0.2)',
    borderRadius: Spacing.two,
  },
  addScreenshotText: {
    fontSize: 13,
  },
  screenshotPreviewWrapper: {
    gap: Spacing.two,
  },
  screenshotPreview: {
    width: '100%',
    height: 180,
    borderRadius: Spacing.two,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  removeScreenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  removeScreenshotText: {
    color: '#FF3B30',
    fontSize: 12,
  },
});
