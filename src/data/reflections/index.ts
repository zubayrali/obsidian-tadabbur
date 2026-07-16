// Verse-keyed index over every falah:// reference in the vault. Pure — NO
// "obsidian" import — so it stays vitest-testable. The reader reads it to show
// per-verse reflections/mentions/connections; connections come from co-citation,
// not from Obsidian's backlink graph.

import type { FoundReference, IslamicReference } from "../../falah-api";

/** Every verse key a reference covers. A range 2:255-256 → ["2:255","2:256"]. */
export function expandVerseKeys(ref: IslamicReference): string[] {
	if (ref.kind === "hadith") return [`${ref.collection}:${ref.number}`];
	const to = ref.toAyah ?? ref.ayah;
	const keys: string[] = [];
	for (let a = ref.ayah; a <= to; a++) keys.push(`${ref.surah}:${a}`);
	return keys;
}

export interface RefLocation {
	path: string;
	line: number; // 0-based
	isCallout: boolean;
	label: string;
}

export interface ReflectionIndex {
	reflectionsFor(key: string): RefLocation[];
	mentionsFor(key: string): RefLocation[];
	connectionsFor(key: string): { key: string; weight: number }[];
	count(key: string): number;
}

const CALLOUT_LINE = /^\s*>\s*\[!/;

export function buildIndex(
	files: { path: string; content: string }[],
	findReferences: (text: string) => FoundReference[]
): ReflectionIndex {
	const byKey = new Map<string, RefLocation[]>();
	const fileKeys = new Map<string, Set<string>>(); // path → keys cited in that file

	for (const f of files) {
		const keysInFile = new Set<string>();
		f.content.split("\n").forEach((line, i) => {
			const isCallout = CALLOUT_LINE.test(line);
			for (const found of findReferences(line)) {
				for (const key of expandVerseKeys(found.ref)) {
					const loc: RefLocation = { path: f.path, line: i, isCallout, label: found.label };
					let list = byKey.get(key);
					if (!list) byKey.set(key, (list = []));
					list.push(loc);
					keysInFile.add(key);
				}
			}
		});
		fileKeys.set(f.path, keysInFile);
	}

	return {
		reflectionsFor: (key) => (byKey.get(key) ?? []).filter((l) => l.isCallout),
		mentionsFor: (key) => (byKey.get(key) ?? []).filter((l) => !l.isCallout),
		count: (key) => (byKey.get(key) ?? []).length,
		connectionsFor: (key) => {
			const weights = new Map<string, number>();
			for (const keys of fileKeys.values()) {
				if (!keys.has(key)) continue;
				for (const other of keys) {
					if (other === key) continue;
					weights.set(other, (weights.get(other) ?? 0) + 1);
				}
			}
			return [...weights].map(([k, weight]) => ({ key: k, weight })).sort((a, b) => b.weight - a.weight);
		},
	};
}
