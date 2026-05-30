import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { 
  getThemePreference, 
  setThemePreference, 
  getAiProvider, 
  setAiProvider, 
  getApiKey, 
  setApiKey,
  AppTheme,
  AiProvider
} from '@/services/storage';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppTheme } from '@/context/theme-context';

export default function SettingsScreen() {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { setTheme } = useAppTheme();

  const [activeTheme, setActiveTheme] = useState<AppTheme>('system');
  const [activeProvider, setActiveProvider] = useState<AiProvider>('none');
  
  // API Keys inputs
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  // Visibility toggles
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const themePref = await getThemePreference();
      const providerPref = await getAiProvider();
      
      const gKey = await getApiKey('gemini');
      const oKey = await getApiKey('openai');
      const aKey = await getApiKey('anthropic');

      setActiveTheme(themePref);
      setActiveProvider(providerPref);
      
      setGeminiKey(gKey || '');
      setOpenaiKey(oKey || '');
      setAnthropicKey(aKey || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const handleSaveTheme = async (themePref: AppTheme) => {
    try {
      await setTheme(themePref);
      setActiveTheme(themePref);
      Alert.alert('Theme Updated', 'Your visual theme preference has been saved.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProvider = async (providerPref: AiProvider) => {
    try {
      await setAiProvider(providerPref);
      setActiveProvider(providerPref);
      Alert.alert('Provider Updated', `AI Assistant is now configured to use ${providerPref.toUpperCase()}.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveKey = async (provider: AiProvider, val: string) => {
    try {
      await setApiKey(provider, val);
      Alert.alert('Key Saved', `Successfully updated API Key securely for ${provider.toUpperCase()}.`);
    } catch (e) {
      Alert.alert('Error', 'Could not store key securely.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, { paddingTop: safeAreaInsets.top, paddingBottom: BottomTabInset + Spacing.six }]}>
        
        {/* Header Title */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.brandTitle}>
            Settings
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Manage application preferences and security
          </ThemedText>
        </View>

        {/* 1. Theme Selection */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            App Appearance
          </ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }]}>
            <View style={styles.buttonGroup}>
              {(['light', 'dark', 'system'] as AppTheme[]).map((themeVal) => {
                const isActive = activeTheme === themeVal;
                return (
                  <Pressable
                    key={themeVal}
                    onPress={() => handleSaveTheme(themeVal)}
                    style={[
                      styles.choiceButton,
                      isActive && { backgroundColor: theme.backgroundSelected },
                    ]}>
                    <ThemedText type="smallBold" style={styles.choiceText}>
                      {themeVal.toUpperCase()}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* 2. AI Provider Selection */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            AI Assistant Service
          </ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }]}>
            <View style={styles.buttonGroup}>
              {(['gemini', 'openai', 'anthropic', 'none'] as AiProvider[]).map((providerVal) => {
                const isActive = activeProvider === providerVal;
                return (
                  <Pressable
                    key={providerVal}
                    onPress={() => handleSaveProvider(providerVal)}
                    style={[
                      styles.choiceButton,
                      isActive && { backgroundColor: theme.backgroundSelected },
                    ]}>
                    <ThemedText type="smallBold" style={styles.choiceText}>
                      {providerVal === 'none' ? 'OFFLINE' : providerVal.toUpperCase()}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
              Select "OFFLINE" to run local analysis templates without any API keys or internet connection.
            </ThemedText>
          </View>
        </View>

        {/* 3. Secure Key Inputs */}
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Secure API Credentials
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitleLabel}>
            Keys are encrypted on-device using secure hardware keychains.
          </ThemedText>

          {/* Gemini */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }, styles.keyCard]}>
            <View style={styles.keyCardHeader}>
              <ThemedText type="smallBold" style={styles.keyLabel}>
                Google Gemini Key
              </ThemedText>
              <Pressable
                onPress={() => handleSaveKey('gemini', geminiKey)}
                style={({ pressed }) => [styles.saveKeyBtn, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.saveKeyBtnText}>Save</ThemedText>
              </Pressable>
            </View>
            
            <View style={[styles.inputWrapper, { borderColor: theme.borderColor }]}>
              <TextInput
                secureTextEntry={!showGemini}
                value={geminiKey}
                onChangeText={setGeminiKey}
                placeholder="AIzaSy..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.keyInput, { color: theme.text }]}
              />
              <Pressable onPress={() => setShowGemini(!showGemini)} style={styles.visibilityToggle}>
                <SymbolView
                  name={{ ios: showGemini ? 'eye.slash' : 'eye', android: showGemini ? 'visibility_off' : 'visibility', web: showGemini ? 'visibility_off' : 'visibility' }}
                  tintColor={theme.textSecondary}
                  size={16}
                />
              </Pressable>
            </View>
          </View>

          {/* OpenAI */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }, styles.keyCard]}>
            <View style={styles.keyCardHeader}>
              <ThemedText type="smallBold" style={styles.keyLabel}>
                OpenAI GPT Key
              </ThemedText>
              <Pressable
                onPress={() => handleSaveKey('openai', openaiKey)}
                style={({ pressed }) => [styles.saveKeyBtn, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.saveKeyBtnText}>Save</ThemedText>
              </Pressable>
            </View>
            
            <View style={[styles.inputWrapper, { borderColor: theme.borderColor }]}>
              <TextInput
                secureTextEntry={!showOpenai}
                value={openaiKey}
                onChangeText={setOpenaiKey}
                placeholder="sk-proj-..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.keyInput, { color: theme.text }]}
              />
              <Pressable onPress={() => setShowOpenai(!showOpenai)} style={styles.visibilityToggle}>
                <SymbolView
                  name={{ ios: showOpenai ? 'eye.slash' : 'eye', android: showOpenai ? 'visibility_off' : 'visibility', web: showOpenai ? 'visibility_off' : 'visibility' }}
                  tintColor={theme.textSecondary}
                  size={16}
                />
              </Pressable>
            </View>
          </View>

          {/* Anthropic */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.borderColor }, styles.keyCard]}>
            <View style={styles.keyCardHeader}>
              <ThemedText type="smallBold" style={styles.keyLabel}>
                Anthropic Claude Key
              </ThemedText>
              <Pressable
                onPress={() => handleSaveKey('anthropic', anthropicKey)}
                style={({ pressed }) => [styles.saveKeyBtn, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.saveKeyBtnText}>Save</ThemedText>
              </Pressable>
            </View>
            
            <View style={[styles.inputWrapper, { borderColor: theme.borderColor }]}>
              <TextInput
                secureTextEntry={!showAnthropic}
                value={anthropicKey}
                onChangeText={setAnthropicKey}
                placeholder="sk-ant-..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.keyInput, { color: theme.text }]}
              />
              <Pressable onPress={() => setShowAnthropic(!showAnthropic)} style={styles.visibilityToggle}>
                <SymbolView
                  name={{ ios: showAnthropic ? 'eye.slash' : 'eye', android: showAnthropic ? 'visibility_off' : 'visibility', web: showAnthropic ? 'visibility_off' : 'visibility' }}
                  tintColor={theme.textSecondary}
                  size={16}
                />
              </Pressable>
            </View>
          </View>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'stretch',
    gap: Spacing.five,
  },
  header: {
    paddingVertical: Spacing.three,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  subtitleLabel: {
    fontSize: 12,
    marginTop: -Spacing.one,
    marginBottom: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.08)',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  choiceButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.04)',
  },
  choiceText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 11.5,
    marginTop: Spacing.three,
    lineHeight: 18,
  },
  keyCard: {
    marginVertical: Spacing.one,
    gap: Spacing.two,
  },
  keyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  keyLabel: {
    fontSize: 12.5,
  },
  saveKeyBtn: {
    backgroundColor: '#0284F5',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveKeyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.05)',
  },
  keyInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.two - 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  visibilityToggle: {
    padding: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
