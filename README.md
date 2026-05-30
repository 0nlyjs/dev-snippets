# DevSnippets 💻✨

DevSnippets is a modern, developer-focused, offline-first mobile and web application built using Expo SDK 55, React Native, and TypeScript. It serves as a secure, sandboxed developer notebook designed to allow cataloging, editing, organizing, sharing, exporting, and understanding code snippets directly on-device.

---

## 🚀 Key Features

*   **Snippet Manager (Offline-First)**: Full CRUD capabilities (create, read, update, delete) for code snippets, backed by localized on-device databases. Offers advanced horizontal quick-filtering by programming language and interactive searches.
*   **Encrypted AI Code Assistant**: Securely connects to **Google Gemini**, **OpenAI**, and **Anthropic Claude** to generate rich, step-by-step code reviews, execution summaries, and specific optimization tips. All AI reports are cached directly in the local database for subsequent instant offline loading.
*   **Sandbox File Browser**: A dedicated file system interface listing stored snippets, attached reference screenshots, and pre-seeded boilerplates (e.g., React Native cheat sheets, Async fetch utilities).
*   **Iridescent Glassmorphic Theme**: A premium, custom-tailored Light and Dark appearance incorporating semi-translucent visual elements, optimized contrast ratios, and unified borders, driven by a reactive global theme context.
*   **Seamless Sharing & Exporting**: Instant file rendering to save snippets locally as `.txt`, `.js`, or `.json` formats, with direct support for the native OS sharing tray to broadcast code blocks instantly.

---

## 🛠️ Technology Stack & Storage Architecture

DevSnippets utilizes specialized on-device storage tools matching industry standards:

| Technology | Purpose & Usage in DevSnippets |
| :--- | :--- |
| **SQLite (`expo-sqlite`)** | Powering the offline-first native mobile (iOS & Android) relational database schema for snippets. |
| **AsyncStorage** | Resolving reactive theme choices, active AI provider preferences, and serving as a robust local driver replacement on web browser environments. |
| **SecureStore (`expo-secure-store`)** | Encrypting and storing sensitive user API keys on-device using secure hardware keychains. |
| **Expo FileSystem** | Sandboxing file exports, template boilerplates, and screenshot assets chosen via `expo-image-picker`. |

---

## 📂 Project Structure

```text
src/
├── app/                  # File-based routing (Expo Router)
│   ├── _layout.tsx       # Root migrations, folder boot, Theme Provider
│   ├── index.tsx         # Home: List, horizontal languages, and searches
│   ├── create.tsx        # Creation form, custom inputs, camera pickers
│   ├── favorites.tsx     # Bookmarked codes panel
│   ├── files.tsx         # File manager browser
│   ├── settings.tsx      # Theme preferences and secure AI key registers
│   └── snippet/[id].tsx  # Detailed viewing and cached AI Assistant tab
├── components/           # Reusable UI widgets
│   ├── snippet-card.tsx  # Interactive catalog card previews
│   ├── code-view.tsx     # Monospaced code reader with dynamic line-numbering
│   ├── themed-text.tsx   # Typography tokens
│   └── themed-view.tsx   # Dynamic glass container widgets
├── context/              # Global state contexts
│   └── theme-context.tsx # Reactive Light/Dark appearance provider
├── hooks/                # Custom React hooks
│   └── use-theme.ts      # Reactive theme hook
├── services/             # Background services
│   ├── database.ts       # SQLite native engine
│   ├── database.web.ts   # Web AsyncStorage mock fallback engine
│   ├── storage.ts        # Preferences & secure token registers
│   ├── filesystem.ts     # Directory manager & native Share hooks
│   └── ai.ts             # API interfaces (Gemini/OpenAI/Claude)
```

---

## 🚀 Getting Started

Follow these steps to run the project locally on your device or browser:

### 1. Install Dependencies
Always use `npx expo install` to ensure that native packages resolve to SDK 55 compatible releases:
```bash
npm install
npx expo install expo-sqlite @react-native-async-storage/async-storage expo-secure-store expo-file-system expo-image-picker expo-sharing
```

### 2. Start the Development Server
```bash
# Start standard server
npx expo start

# Start server clearing bundling caches
npx expo start -c
```

### 3. Build & Export Static Bundles
Verify that all routes compile and bundle correctly for iOS, Android, and Web:
```bash
npx expo export
```

### 4. Run TypeScript checks
```bash
npx tsc --noEmit
```
