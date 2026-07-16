// Obsidian adapter over the pure buildIndex: scans vault Markdown once at
// layout-ready and rebuilds (debounced) on any vault change. ponytail: full
// rebuild is O(vault) per change batch; a personal journal is small, so this
// stays simple — switch to per-file patching only if a large vault drags.

import type { App } from "obsidian";
import { buildIndex, type ReflectionIndex, type RefLocation } from "./index";
import { getFalah } from "../../falah-runtime";

export class ReflectionIndexService implements ReflectionIndex {
	private index: ReflectionIndex | null = null;
	private timer: number | null = null;
	private listeners = new Set<() => void>();

	constructor(private app: App) {}

	async scanAll(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		const contents = await Promise.all(
			files.map(async (f) => ({ path: f.path, content: await this.app.vault.cachedRead(f) }))
		);
		this.index = buildIndex(contents, getFalah().ref.findReferences);
		for (const cb of this.listeners) cb();
	}

	scheduleRescan(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(() => {
			this.timer = null;
			void this.scanAll();
		}, 400);
	}

	/** Register a change listener; returns an unsubscribe function. */
	onChange(cb: () => void): () => void {
		this.listeners.add(cb);
		return () => this.listeners.delete(cb);
	}

	/** Clear the pending rescan timer and listeners; call on plugin unload. */
	dispose(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
		this.listeners.clear();
	}

	reflectionsFor(key: string): RefLocation[] {
		return this.index?.reflectionsFor(key) ?? [];
	}
	mentionsFor(key: string): RefLocation[] {
		return this.index?.mentionsFor(key) ?? [];
	}
	connectionsFor(key: string): { key: string; weight: number }[] {
		return this.index?.connectionsFor(key) ?? [];
	}
	count(key: string): number {
		return this.index?.count(key) ?? 0;
	}
}
