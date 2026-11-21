# Abbreviations

An Obsidian plugin that treats a note property as extra aliases, so you can find notes by their abbreviations in [Omnisearch](https://github.com/scambier/obsidian-omnisearch), the quick switcher and `[[` link suggestions.

With the property name set to `abbreviations`, searching for `MK1` finds this note.

## How it works

- Your notes are never edited. The abbreviations are added to the note's aliases in memory, by wrapping Obsidian's metadata cache lookup.
- A single string value is split on commas, like Obsidian does for `aliases`. A list is used as is.
- The property name is matched case-insensitively.

## Settings

- **Abbreviation property**: the name of the property that holds abbreviations. Defaults to `abbreviations`.

## Omnisearch

Omnisearch only re-indexes notes whose files changed. When the property name changes (including the first time the plugin runs), the plugin asks Omnisearch to re-index the notes that have abbreviations. This needs a version of Omnisearch that has the `reindexNotes` API.

If you turn the plugin off for a while and back on, run **Abbreviations: Re-index notes in Omnisearch** from the command palette.

## Caveats

- This relies on replacing `app.metadataCache.getCache`, which is not a documented extension point. A future Obsidian update could break it.
- Anything that reads aliases from the metadata cache sees the abbreviations, for example Bases tables that show the `aliases` property.

## Development

```bash
npm install
npm run dev
```

`npm run build` writes `dist/main.js` and `dist/manifest.json`. Copy or symlink `dist` into `<vault>/.obsidian/plugins/abbreviations`.
