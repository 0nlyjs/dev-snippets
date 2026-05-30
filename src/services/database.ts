import * as SQLite from 'expo-sqlite';

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

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Gets the open database instance. Opens it if not already opened.
 */
export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('snippets.db');
  }
  return dbInstance;
}

/**
 * Initializes the database schema.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDB();
  
  // Set journal mode to WAL for concurrency
  await db.execAsync('PRAGMA journal_mode = WAL;');
  
  // Create tables if they do not exist
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      tags TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      screenshot_path TEXT,
      explanation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Map raw SQLite row to typescript Snippet object
 */
function mapRowToSnippet(row: any): Snippet {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags);
    if (!Array.isArray(tags)) {
      tags = [];
    }
  } catch (e) {
    // Fallback if not valid JSON
    tags = typeof row.tags === 'string' ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  }

  return {
    id: row.id,
    title: row.title,
    code: row.code,
    language: row.language,
    tags,
    is_favorite: row.is_favorite === 1,
    screenshot_path: row.screenshot_path,
    explanation: row.explanation,
    created_at: row.created_at,
  };
}

/**
 * Fetches all snippets.
 */
export async function getAllSnippets(): Promise<Snippet[]> {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM snippets ORDER BY created_at DESC');
  return rows.map(mapRowToSnippet);
}

/**
 * Fetches favorited snippets.
 */
export async function getFavoriteSnippets(): Promise<Snippet[]> {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM snippets WHERE is_favorite = 1 ORDER BY created_at DESC');
  return rows.map(mapRowToSnippet);
}

/**
 * Searches and filters snippets.
 */
export async function searchSnippets(searchQuery: string, selectedLanguage?: string): Promise<Snippet[]> {
  const db = await getDB();
  
  let sql = 'SELECT * FROM snippets WHERE 1=1';
  const params: any[] = [];

  if (selectedLanguage && selectedLanguage !== 'All') {
    sql += ' AND language = ?';
    params.push(selectedLanguage);
  }

  if (searchQuery.trim().length > 0) {
    const searchWildcard = `%${searchQuery.trim()}%`;
    sql += ' AND (title LIKE ? OR code LIKE ? OR tags LIKE ?)';
    params.push(searchWildcard, searchWildcard, searchWildcard);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = await db.getAllAsync(sql, params);
  return rows.map(mapRowToSnippet);
}

/**
 * Fetches a single snippet by ID.
 */
export async function getSnippetById(id: number): Promise<Snippet | null> {
  const db = await getDB();
  const row = await db.getFirstAsync('SELECT * FROM snippets WHERE id = ?', [id]);
  if (!row) return null;
  return mapRowToSnippet(row);
}

/**
 * Inserts a new snippet.
 */
export async function createSnippet(input: CreateSnippetInput): Promise<Snippet> {
  const db = await getDB();
  const tagsStr = JSON.stringify(input.tags);
  
  const result = await db.runAsync(
    'INSERT INTO snippets (title, code, language, tags, screenshot_path) VALUES (?, ?, ?, ?, ?)',
    [input.title, input.code, input.language, tagsStr, input.screenshot_path || null]
  );

  const inserted = await getSnippetById(result.lastInsertRowId);
  if (!inserted) {
    throw new Error('Failed to retrieve newly created snippet');
  }
  return inserted;
}

/**
 * Updates an existing snippet.
 */
export async function updateSnippet(
  id: number,
  updates: Partial<Omit<Snippet, 'id' | 'created_at'>>
): Promise<Snippet> {
  const db = await getDB();
  const current = await getSnippetById(id);
  if (!current) {
    throw new Error(`Snippet with ID ${id} not found`);
  }

  const title = updates.title !== undefined ? updates.title : current.title;
  const code = updates.code !== undefined ? updates.code : current.code;
  const language = updates.language !== undefined ? updates.language : current.language;
  const tagsStr = updates.tags !== undefined ? JSON.stringify(updates.tags) : JSON.stringify(current.tags);
  const screenshot = updates.screenshot_path !== undefined ? updates.screenshot_path : current.screenshot_path;
  const explanation = updates.explanation !== undefined ? updates.explanation : current.explanation;
  const isFavorite = updates.is_favorite !== undefined ? (updates.is_favorite ? 1 : 0) : (current.is_favorite ? 1 : 0);

  await db.runAsync(
    `UPDATE snippets 
     SET title = ?, code = ?, language = ?, tags = ?, screenshot_path = ?, explanation = ?, is_favorite = ?
     WHERE id = ?`,
    [title, code, language, tagsStr, screenshot || null, explanation || null, isFavorite, id]
  );

  const updated = await getSnippetById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated snippet');
  }
  return updated;
}

/**
 * Deletes a snippet.
 */
export async function deleteSnippet(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM snippets WHERE id = ?', [id]);
}

/**
 * Toggles the favorite status of a snippet.
 */
export async function toggleFavorite(id: number): Promise<Snippet> {
  const db = await getDB();
  const current = await getSnippetById(id);
  if (!current) {
    throw new Error(`Snippet with ID ${id} not found`);
  }

  const newFavorite = current.is_favorite ? 0 : 1;
  await db.runAsync('UPDATE snippets SET is_favorite = ? WHERE id = ?', [newFavorite, id]);

  const updated = await getSnippetById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated snippet after favorite toggle');
  }
  return updated;
}

/**
 * Gets all unique languages used in snippets.
 */
export async function getUsedLanguages(): Promise<string[]> {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT DISTINCT language FROM snippets WHERE language != "" ORDER BY language ASC');
  return rows.map((row: any) => row.language);
}
