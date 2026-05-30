import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export type AppTheme = 'light' | 'dark' | 'system';
export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'none';

const THEME_KEY = 'snippet-app-theme';
const AI_PROVIDER_KEY = 'snippet-app-ai-provider';
const API_KEY_PREFIX = 'snippet-app-api-key-';

/**
 * Loads the user's preferred color scheme theme from AsyncStorage.
 * Default is 'system'.
 */
export async function getThemePreference(): Promise<AppTheme> {
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
  } catch (error) {
    console.error('Failed to load theme preference', error);
  }
  return 'system';
}

/**
 * Saves the user's preferred color scheme theme to AsyncStorage.
 */
export async function setThemePreference(theme: AppTheme): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme preference', error);
  }
}

/**
 * Loads the active AI API provider (e.g. 'gemini', 'openai', 'anthropic', 'none').
 */
export async function getAiProvider(): Promise<AiProvider> {
  try {
    const value = await AsyncStorage.getItem(AI_PROVIDER_KEY);
    if (value === 'gemini' || value === 'openai' || value === 'anthropic' || value === 'none') {
      return value;
    }
  } catch (error) {
    console.error('Failed to load AI provider preference', error);
  }
  return 'none';
}

/**
 * Saves the active AI API provider to AsyncStorage.
 */
export async function setAiProvider(provider: AiProvider): Promise<void> {
  try {
    await AsyncStorage.setItem(AI_PROVIDER_KEY, provider);
  } catch (error) {
    console.error('Failed to save AI provider preference', error);
  }
}

/**
 * Securely saves an API key for a given provider (Gemini, OpenAI, etc.).
 */
export async function setApiKey(provider: AiProvider, apiKey: string): Promise<void> {
  if (provider === 'none') return;
  try {
    const keyName = `${API_KEY_PREFIX}${provider}`;
    if (!apiKey || apiKey.trim() === '') {
      await SecureStore.deleteItemAsync(keyName);
    } else {
      await SecureStore.setItemAsync(keyName, apiKey.trim());
    }
  } catch (error) {
    console.error(`Failed to save API key securely for ${provider}`, error);
  }
}

/**
 * Securely loads an API key for a given provider from SecureStore.
 */
export async function getApiKey(provider: AiProvider): Promise<string | null> {
  if (provider === 'none') return null;
  try {
    const keyName = `${API_KEY_PREFIX}${provider}`;
    const value = await SecureStore.getItemAsync(keyName);
    return value;
  } catch (error) {
    console.error(`Failed to get API key securely for ${provider}`, error);
    return null;
  }
}

/**
 * Securely deletes an API key for a given provider from SecureStore.
 */
export async function deleteApiKey(provider: AiProvider): Promise<void> {
  if (provider === 'none') return;
  try {
    const keyName = `${API_KEY_PREFIX}${provider}`;
    await SecureStore.deleteItemAsync(keyName);
  } catch (error) {
    console.error(`Failed to delete API key securely for ${provider}`, error);
  }
}
