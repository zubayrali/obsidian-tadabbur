// Per-verse strip: reflections, mentions, and co-cited "connected" verses,
// read from the ReflectionIndexService. Suppressed entirely when the index
// has nothing for this ayah.

import type { App } from "obsidian";
import { getFalah } from "../falah-runtime";
import type { ReflectionIndexService } from "../data/reflections/service";

export function renderReflectionStrip(
	index: ReflectionIndexService,
	app: App,
	row: HTMLElement,
	ayahKey: string
): void {
	const reflections = index.reflectionsFor(ayahKey);
	const mentions = index.mentionsFor(ayahKey);
	const connections = index.connectionsFor(ayahKey);
	if (!reflections.length && !mentions.length && !connections.length) return;

	const strip = row.createDiv({ cls: "falah-reflect-strip" });
	const openLoc = (path: string, line: number) => {
		void app.workspace.openLinkText(path, "", true).then(() => {
			const ed = app.workspace.activeEditor?.editor;
			ed?.setCursor({ line, ch: 0 });
		});
	};
	const group = (label: string, locs: { path: string; line: number }[]) => {
		if (!locs.length) return;
		const span = strip.createSpan({ cls: "falah-reflect-group" });
		span.createSpan({ cls: "falah-reflect-label", text: `${label} (${locs.length})` });
		for (const loc of locs) {
			const base = loc.path.split("/").pop()?.replace(/\.md$/, "") ?? loc.path;
			const a = span.createEl("a", { cls: "falah-reflect-link", text: base });
			a.onclick = (e) => {
				e.preventDefault();
				openLoc(loc.path, loc.line);
			};
		}
	};
	group("Reflections", reflections);
	group("Mentions", mentions);

	if (connections.length) {
		const span = strip.createSpan({ cls: "falah-reflect-group" });
		span.createSpan({ cls: "falah-reflect-label", text: "Connected:" });
		for (const c of connections) {
			const parsed = getFalah().ref.parseAyahKey(c.key);
			if (!parsed) continue;
			const a = span.createEl("a", { cls: "falah-reflect-link", text: c.key });
			a.onclick = (e) => {
				e.preventDefault();
				getFalah().navigateReaderTo(parsed.surah, parsed.ayah);
			};
		}
	}
}
