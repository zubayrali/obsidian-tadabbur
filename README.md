# Tadabbur

Quran reflection journaling for Obsidian. Tadabbur connects the verses you read in Falah with durable, plain-Markdown reflections in your vault.

## Requires Falah

Tadabbur is a companion plugin and requires [Falah](https://github.com/zubayrali/obsidian-falah) with plugin API v7 or newer. Falah supplies Quran text, rendered references, the reader, and the extension points Tadabbur uses. Install and enable Falah before enabling Tadabbur.

## Features

- **Reflect from the reader.** Open an ayah's action menu and select **Reflect on this verse**.
- **Reflect from references.** Right-click or long-press a rendered Quran reference, or use the action in its detail view.
- **Reflect while writing.** Enter `/reflect`, choose an ayah, and insert the reflection at the cursor.
- **Choose where reflections live.** Save to a per-ayah note, today's Daily Note, ask each time, or insert at the cursor.
- **Keep your existing notes.** Tadabbur appends under the configured heading and never replaces an existing reflection.
- **Use guided scaffolds.** Start with Summary / Meaning / Action or Self-examination / Gratitude / Du'a, then edit freely.
- **Connect ideas automatically.** Falah's reader shows reflections, ordinary mentions, and verses co-cited in the same note.
- **Browse reflections with Bases.** Run **Create reflections base** to create `Reflections.base` with list, theme, and card views.
- **Work in English or Arabic.** All current Tadabbur interface text is localized in both languages.

Reflection callouts and metadata remain ordinary Markdown and frontmatter inside your vault. Tadabbur does not send vault content to an external service.

## Reflection destinations

### Per-ayah notes

The default path is `Tadabbur/<surah>-<ayah>.md`, such as `Tadabbur/2-255.md`. Repeated reflections on the same ayah append to the same note.

### Daily Notes

Tadabbur follows the core Daily Notes plugin's folder, date format, and template, then appends beneath the configured heading. The default heading is `Tadabbur`.

### Current note

The `/reflect` slash action inserts a complete Quran callout and reflection scaffold at the current cursor position.

## Settings

- **Save reflections to** — per-ayah note, today's Daily Note, or ask each time.
- **Per-ayah reflection folder** — defaults to `Tadabbur`.
- **Daily-note heading** — defaults to `Tadabbur`.
- **Default reflection scaffold** — controls the initial prompt structure.

Settings display the normalized destination so you can see where the next reflection will be written.

## Manual installation

Until the first GitHub release is published:

1. Install and enable Falah API v7 or newer.
2. Run `npm install` and `npm run build` in this repository.
3. Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/falah-tadabbur/`.
4. Reload Obsidian and enable **Tadabbur** under **Settings → Community plugins**.

## Development

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
npm run check  # release metadata, lint, tests, and production build
```

Tadabbur consumes Falah's public plugin API through `app.plugins.plugins["falah"].api`. It imports no Falah source; the local contract mirror lives in `src/falah-api.d.ts`.

## License

0BSD. See [LICENSE](LICENSE).
