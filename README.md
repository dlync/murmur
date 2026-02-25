# murmur.

A quiet journaling app for daily reflection. Built with React Native + Expo.

## Design

Ported from the murmur Flask web app — warm linen palette, editorial typography, 
minimal UI. Replicated the original CSS design tokens directly in StyleSheet:

- `#F2EFE9` background (warm linen)
- `#5E7A8A` accent (dusty blue)  
- Georgia serif (approximates Fraunces web font)
- Uppercase Syne-style nav labels

## Screens

- **Today** — Daily quote, stats, compose new entry, recent entries
- **Archive** — All entries with full-text search + tag filtering, long-press to delete
- **Profile** — Stats overview, 30-day activity grid, tag distribution bar chart, editable username

## Setup

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Then press `i` for iOS simulator, `a` for Android, or `w` for web.

## Features

- Persistent storage via AsyncStorage (survives app restarts)
- Tag pills: life · gratitude · nature · honesty · reflection
- Daily rotating quote
- Character counter
- Streak tracking
- 30-day activity heatmap

## Project Structure

```
murmur/
├── App.tsx                    # Root — nav tabs + screen routing
├── app.json                   # Expo config
├── package.json
├── constants/
│   ├── theme.ts               # Colors, spacing (mirrors murmur.css :root vars)
│   └── data.ts                # Quotes, tags, date helpers
├── hooks/
│   └── useThoughts.ts         # AsyncStorage persistence, CRUD
└── components/
    ├── DashboardScreen.tsx    # Today tab
    ├── ArchiveScreen.tsx      # Archive tab
    └── ProfileScreen.tsx      # Profile tab
```
