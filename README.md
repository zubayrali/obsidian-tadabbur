# Tadabbur

Quran reflection and journaling for Obsidian. Reflect on an ayah straight from the reader, and your notes become a map of which verses you've sat with — and which ones you connect.

## Requires Falah

**Tadabbur is a companion plugin. It does nothing on its own, and it will not enable without [Falah](https://github.com/zubayrali/obsidian-falah) installed and enabled.**

Falah provides the Quran text, translations, and the reader that Tadabbur hooks into. Install Falah first, then enable Tadabbur.

The split is deliberate: if you only want a Quran reader with clickable references, Falah alone is that — and none of the journaling opinions below get forced on you.

## What it does

- **Reflect from the reader.** Right-click (or ⋯) any ayah → *Reflect on this verse* → write. It's saved with the verse quoted above it.
- **Your notes, your structure.** Write to a per-ayah note (`Tadabbur/2-255.md`) or append to today's daily note — honouring your own Daily Notes folder, format, and **template**. Reflect on the same ayah again next week and it appends; nothing is overwritten.
- **Connections without link plumbing.** The verse callout Tadabbur inserts *is* the connection. Cite 2:255 and 59:22 in one reflection and the reader shows that link from **either** verse — no `[[2:255]]` wikilinks, which nobody reads or remembers by number anyway.
- **Reflections surface where you read.** Under each ayah: which of your notes reflect on it, which merely mention it, and which verses you've connected it to. Click through to the note in a new tab.
- **Prompts, not blank pages.** Optional scaffolds — *Summary / What it means to me / One action*, or *self-examination / gratitude / du'ā*. Offline, editable, no AI.
- **Works with Bases.** Reflections are stamped with `verses`, `themes`, and `#tadabbur` frontmatter. The *Create reflections base* command drops in a ready-made Base with timeline, by-theme, and card views.

Everything is plain Markdown in your vault. Nothing is stored anywhere else.

## Install

Until this is in the community plugin store:

1. Install and enable **[Falah](https://github.com/zubayrali/obsidian-falah)**.
2. Download `main.js`, `manifest.json`, and `styles.css` from this repo's latest release.
3. Put them in `<vault>/.obsidian/plugins/falah-tadabbur/`.
4. Reload Obsidian and enable **Tadabbur** in Community Plugins.

## Settings

- **Save reflections to** — per-ayah note, today's daily note, or ask each time.
- **Per-ayah reflection folder** — default `Tadabbur`.
- **Daily-note heading** — the heading reflections are appended under. Default `Tadabbur`.
- **Default reflection scaffold** — which prompt structure the capture box starts with.

## Development

```bash
npm install
npm run dev    # watch build
npm test       # vitest
```

Tadabbur consumes Falah's public plugin API (`app.plugins.plugins["falah"].api`, v3+) and imports **no Falah source** — only the vendored types in `src/falah-api.d.ts`. If Falah's public API changes, update that file and the version floor in `src/falah-runtime.ts` together.

## License

MIT
