import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  tags: string[];
  is_favorite: boolean;
  screenshot_path?: string | null;
  explanation?: string | null;
  created_at: string;
}

export interface CreateSnippetInput {
  title: string;
  code: string;
  language: string;
  tags: string[];
  screenshot_path?: string | null;
}

const STORAGE_KEY = 'dev-snippets-web-db';

async function getStoredSnippets(): Promise<Snippet[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to retrieve web snippets:', e);
    return [];
  }
}

async function saveStoredSnippets(snippets: Snippet[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  } catch (e) {
    console.error('Failed to save web snippets:', e);
  }
}

/**
 * Initializes the database (no-op on web since AsyncStorage is self-initializing).
 */
export async function initDatabase(): Promise<void> {
  // Pre-seed with some beautiful mock snippets if empty so the Web demo looks gorgeous
  const current = await getStoredSnippets();
  if (current.length === 0) {
    const seed: Snippet[] = [
      {
        id: 1,
        title: 'Fetch API Helper Wrapper',
        code: `// Fetch helper with timeout and custom headers
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  
  return response.json();
}`,
        language: 'JavaScript',
        tags: ['fetch', 'api', 'utility'],
        is_favorite: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        title: 'Golang Parallel HTTP Worker Pool',
        code: `package main

import (
	"fmt"
	"net/http"
	"sync"
)

func worker(id int, jobs <-chan string, results chan<- string, wg *sync.WaitGroup) {
	defer wg.Done()
	for url := range jobs {
		resp, err := http.Get(url)
		if err != nil {
			results <- fmt.Sprintf("Worker %d failed: %v", id, err)
			continue
		}
		results <- fmt.Sprintf("Worker %d success: %s", id, resp.Status)
		resp.Body.Close()
	}
}`,
        language: 'Go',
        tags: ['concurrency', 'http', 'worker-pool'],
        is_favorite: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      }
    ];
    await saveStoredSnippets(seed);
  }
}

/**
 * Fetches all snippets.
 */
export async function getAllSnippets(): Promise<Snippet[]> {
  return await getStoredSnippets();
}

/**
 * Fetches favorited snippets.
 */
export async function getFavoriteSnippets(): Promise<Snippet[]> {
  const list = await getStoredSnippets();
  return list.filter(s => s.is_favorite);
}

/**
 * Searches and filters snippets.
 */
export async function searchSnippets(searchQuery: string, selectedLanguage?: string): Promise<Snippet[]> {
  let list = await getStoredSnippets();

  if (selectedLanguage && selectedLanguage !== 'All') {
    list = list.filter(s => s.language.toLowerCase() === selectedLanguage.toLowerCase());
  }

  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.code.toLowerCase().includes(q) || 
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Fetches a single snippet by ID.
 */
export async function getSnippetById(id: number): Promise<Snippet | null> {
  const list = await getStoredSnippets();
  return list.find(s => s.id === id) || null;
}

/**
 * Inserts a new snippet.
 */
export async function createSnippet(input: CreateSnippetInput): Promise<Snippet> {
  const list = await getStoredSnippets();
  const newId = list.length > 0 ? Math.max(...list.map(s => s.id)) + 1 : 1;
  
  const newSnippet: Snippet = {
    id: newId,
    title: input.title,
    code: input.code,
    language: input.language,
    tags: input.tags,
    is_favorite: false,
    screenshot_path: input.screenshot_path,
    created_at: new Date().toISOString(),
  };

  list.unshift(newSnippet);
  await saveStoredSnippets(list);
  return newSnippet;
}

/**
 * Updates an existing snippet.
 */
export async function updateSnippet(
  id: number,
  updates: Partial<Omit<Snippet, 'id' | 'created_at'>>
): Promise<Snippet> {
  const list = await getStoredSnippets();
  const index = list.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error(`Snippet with ID ${id} not found`);
  }

  const current = list[index];
  const updatedSnippet: Snippet = {
    ...current,
    title: updates.title !== undefined ? updates.title : current.title,
    code: updates.code !== undefined ? updates.code : current.code,
    language: updates.language !== undefined ? updates.language : current.language,
    tags: updates.tags !== undefined ? updates.tags : current.tags,
    screenshot_path: updates.screenshot_path !== undefined ? updates.screenshot_path : current.screenshot_path,
    explanation: updates.explanation !== undefined ? updates.explanation : current.explanation,
    is_favorite: updates.is_favorite !== undefined ? updates.is_favorite : current.is_favorite,
  };

  list[index] = updatedSnippet;
  await saveStoredSnippets(list);
  return updatedSnippet;
}

/**
 * Deletes a snippet.
 */
export async function deleteSnippet(id: number): Promise<void> {
  const list = await getStoredSnippets();
  const filtered = list.filter(s => s.id !== id);
  await saveStoredSnippets(filtered);
}

/**
 * Toggles the favorite status of a snippet.
 */
export async function toggleFavorite(id: number): Promise<Snippet> {
  const list = await getStoredSnippets();
  const index = list.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error(`Snippet with ID ${id} not found`);
  }

  const current = list[index];
  current.is_favorite = !current.is_favorite;
  await saveStoredSnippets(list);
  return current;
}

/**
 * Gets all unique languages used in snippets.
 */
export async function getUsedLanguages(): Promise<string[]> {
  const list = await getStoredSnippets();
  const langs = new Set<string>();
  list.forEach(s => {
    if (s.language) langs.add(s.language);
  });
  return Array.from(langs).sort();
}
