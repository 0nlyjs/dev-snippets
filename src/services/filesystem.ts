import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const SNIPPETS_DIR = `${FileSystem.documentDirectory}snippets/`;
export const SCREENSHOTS_DIR = `${FileSystem.documentDirectory}screenshots/`;
export const TEMPLATES_DIR = `${FileSystem.documentDirectory}templates/`;

export interface FileItemInfo {
  name: string;
  uri: string;
  size: number;
  isDirectory: boolean;
  modificationTime?: number;
}

/**
 * Ensures all required application folders exist in the FileSystem document directory.
 */
export async function initFolders(): Promise<void> {
  try {
    const checkAndCreate = async (dirPath: string) => {
      const info = await FileSystem.getInfoAsync(dirPath);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
    };
    await checkAndCreate(SNIPPETS_DIR);
    await checkAndCreate(SCREENSHOTS_DIR);
    await checkAndCreate(TEMPLATES_DIR);
  } catch (error) {
    console.error('Failed to initialize local directories', error);
  }
}

/**
 * Copies a screenshot/image from a temporary picker URI to the secure app storage screenshots directory.
 * @returns The new permanent local file path URI.
 */
export async function saveScreenshot(tempUri: string): Promise<string> {
  await initFolders();
  const filename = `screenshot_${Date.now()}_${tempUri.split('/').pop()}`;
  const permanentUri = `${SCREENSHOTS_DIR}${filename}`;
  await FileSystem.copyAsync({
    from: tempUri,
    to: permanentUri,
  });
  return permanentUri;
}

/**
 * Saves a code snippet as a local text, javascript, or json file.
 * @returns The permanent local path URI where it is saved.
 */
export async function saveSnippetToFile(
  title: string,
  code: string,
  extension: 'txt' | 'js' | 'json',
  directory: string = SNIPPETS_DIR
): Promise<string> {
  await initFolders();
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'snippet';
  const filename = `${sanitizedTitle}_${Date.now()}.${extension}`;
  const fileUri = `${directory}${filename}`;
  
  let fileContent = code;
  if (extension === 'json') {
    // If not already valid JSON, wrap it beautifully in a JSON object
    try {
      JSON.parse(code);
    } catch {
      fileContent = JSON.stringify({ title, code, exportedAt: new Date().toISOString() }, null, 2);
    }
  }

  await FileSystem.writeAsStringAsync(fileUri, fileContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

/**
 * Shares a local file with other applications using Expo Sharing.
 */
export async function shareLocalFile(fileUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not supported on this platform');
  }
  await Sharing.shareAsync(fileUri);
}

/**
 * Deletes a file or directory from local filesystem.
 */
export async function deleteLocalFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.error(`Failed to delete file at ${uri}`, error);
    throw error;
  }
}

/**
 * Browses all files and folders in a specific directory.
 */
export async function listDirectoryContents(dirPath: string): Promise<FileItemInfo[]> {
  await initFolders();
  try {
    const files = await FileSystem.readDirectoryAsync(dirPath);
    const itemPromises = files.map(async (filename) => {
      const uri = `${dirPath}${filename}`;
      const info = await FileSystem.getInfoAsync(uri);
      return {
        name: filename,
        uri,
        size: info.exists && !info.isDirectory ? info.size : 0,
        isDirectory: info.exists ? info.isDirectory : false,
        modificationTime: info.exists ? info.modificationTime : undefined,
      };
    });
    const items = await Promise.all(itemPromises);
    // Sort directories first, then alphabetically
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}`, error);
    return [];
  }
}

/**
 * Copies or moves a file from one path to another.
 */
export async function copyOrMoveFile(fromUri: string, toUri: string, isMove: boolean): Promise<void> {
  try {
    if (isMove) {
      await FileSystem.moveAsync({ from: fromUri, to: toUri });
    } else {
      await FileSystem.copyAsync({ from: fromUri, to: toUri });
    }
  } catch (error) {
    console.error(`Failed to ${isMove ? 'move' : 'copy'} file from ${fromUri} to ${toUri}`, error);
    throw error;
  }
}

/**
 * Pre-seeds helpful boilerplate templates if they don't already exist.
 */
export async function seedTemplates(): Promise<void> {
  await initFolders();
  try {
    const list = await FileSystem.readDirectoryAsync(TEMPLATES_DIR);
    if (list.length > 0) return; // Already seeded

    // 1. React Native Cheatsheet
    const rnCheatsheet = `// React Native Basic Component Cheat Sheet
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';

export default function MyComponent() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hello Dev!</Text>
        <Pressable 
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => console.log('Tapped!')}>
          <Text style={styles.buttonText}>Click Me</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
  card: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#1E1E24',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0284F5',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
`;

    // 2. Fetch API JS
    const fetchApi = `// Complete Asynchronous API Fetch Example with Error Handling
async function fetchData(endpoint, options = {}) {
  const BASE_URL = 'https://api.github.com';
  const url = \`\${BASE_URL}\${endpoint}\`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json',
  };

  const config = {
    method: 'GET',
    headers: { ...defaultHeaders, ...options.headers },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(\`HTTP Error! Status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch operation failed:', error);
    throw error;
  }
}
`;

    // 3. Configurations JSON
    const configJson = `{
  "projectName": "dev-snippets",
  "appVersion": "1.0.0",
  "supportedLanguages": [
    "TypeScript",
    "JavaScript",
    "Python",
    "Go",
    "Rust",
    "HTML",
    "CSS",
    "SQL"
  ],
  "preferences": {
    "offlineMode": true,
    "secureStorageEnabled": true,
    "theme": "system"
  }
}`;

    await FileSystem.writeAsStringAsync(`${TEMPLATES_DIR}react_native_cheatsheet.js`, rnCheatsheet);
    await FileSystem.writeAsStringAsync(`${TEMPLATES_DIR}fetch_boilerplate.js`, fetchApi);
    await FileSystem.writeAsStringAsync(`${TEMPLATES_DIR}app_config.json`, configJson);
  } catch (error) {
    console.error('Failed to seed templates', error);
  }
}
