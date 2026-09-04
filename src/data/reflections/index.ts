// Verse-keyed index over every falah:// reference in the vault. Pure — NO
// "obsidian" import — so it stays vitest-testable. The reader reads it to show
// per-verse reflections/mentions/connections; connections come from co-citation.

import type { FoundReference, IslamicReference } from "../../falah-api";

/** Every verse key a reference covers. A range 2:255-256 → ["2:255","2:256"]. */
export function expandVerseKeys(ref: IslamicReference): string[] {
	if (ref.kind === "hadith") return [`${ref.collection}:${ref.number}`];
	const to = ref.toAyah ?? ref.ayah;
	const keys: string[] = [];
	for (let ayah = ref.ayah; ayah <= to; ayah++) keys.push(`${ref.surah}:${ayah}`);
	return keys;
}

export interface RefLocation {
	path: string;
	line: number;
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

/** Mutable per-file index. Updating one note touches only that note's entries. */
export class IncrementalReflectionIndex implements ReflectionIndex {
	private readonly byKey = new Map<string, RefLocation[]>();
	private readonly fileKeys = new Map<string, Set<string>>();
	private readonly connections = new Map<string, Map<string, number>>();

	constructor(private readonly findReferences: (text: string) => FoundReference[]) {}

	upsertFile(path: string, content: string): void {
		this.removeFile(path);
		const keys = new Set<string>();
		content.split("\n").forEach((line, lineNumber) => {
			const isCallout = CALLOUT_LINE.test(line);
			for (const found of this.findReferences(line)) {
				for (const key of expandVerseKeys(found.ref)) {
					const locations = this.byKey.get(key) ?? [];
					locations.push({ path, line: lineNumber, isCallout, label: found.label });
					this.byKey.set(key, locations);
					keys.add(key);
				}
			}
		});
		this.fileKeys.set(path, keys);
		this.adjustConnections(keys, 1);
	}

	removeFile(path: string): void {
		const keys = this.fileKeys.get(path);
		if (!keys) return;
		this.adjustConnections(keys, -1);
		for (const key of keys) {
			const remaining = (this.byKey.get(key) ?? []).filter((location) => location.path !== path);
			if (remaining.length) this.byKey.set(key, remaining);
			else this.byKey.delete(key);
		}
		this.fileKeys.delete(path);
	}

	private adjustConnections(keys: Set<string>, delta: 1 | -1): void {
		for (const key of keys) {
			for (const other of keys) {
				if (other === key) continue;
				const weights = this.connections.get(key) ?? new Map<string, number>();
				const next = (weights.get(other) ?? 0) + delta;
				if (next > 0) weights.set(other, next);
				else weights.delete(other);
				if (weights.size) this.connections.set(key, weights);
				else this.connections.delete(key);
			}
		}
	}

	reflectionsFor(key: string): RefLocation[] {
		return (this.byKey.get(key) ?? []).filter((location) => location.isCallout);
	}

	mentionsFor(key: string): RefLocation[] {
		return (this.byKey.get(key) ?? []).filter((location) => !location.isCallout);
	}

	connectionsFor(key: string): { key: string; weight: number }[] {
		return [...(this.connections.get(key) ?? [])]
			.map(([connectedKey, weight]) => ({ key: connectedKey, weight }))
			.sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key));
	}

	count(key: string): number {
		return this.byKey.get(key)?.length ?? 0;
	}
}

export function buildIndex(
	files: { path: string; content: string }[],
	findReferences: (text: string) => FoundReference[],
): ReflectionIndex {
	const index = new IncrementalReflectionIndex(findReferences);
	for (const file of files) index.upsertFile(file.path, file.content);
	return index;
}
