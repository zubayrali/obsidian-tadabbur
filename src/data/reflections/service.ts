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
	private lastFingerprint = "";

	constructor(private app: App) {}

	// ponytail: cheap change-detector so unrelated vault edits don't fire listeners
	// (each fire costs a full reader re-render). Not a parser — just
	// path+line+callout-ness+uri. The callout flag matters: it's what splits
	// reflectionsFor from mentionsFor, and un/wrapping a callout in place changes
	// neither the line index nor the uri — without it that edit would be invisible
	// and the strip would keep the ref mis-grouped.
	private fingerprint(files: { path: string; content: string }[]): string {
		const out: string[] = [];
		for (const f of files) {
			f.content.split("\n").forEach((line, i) => {
				const callout = /^\s*>\s*\[!/.test(line) ? "1" : "0";
				for (const m of line.matchAll(/\[[^\]\n]*\]\((falah:\/\/[^\s)]+)\)/g)) {
					out.push(`${f.path}#${i}${callout}:${m[1]}`);
				}
			});
		}
		return out.join("|");
	}

	async scanAll(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		const contents = await Promise.all(
			files.map(async (f) => ({ path: f.path, content: await this.app.vault.cachedRead(f) }))
		);
		const fp = this.fingerprint(contents);
		if (this.index !== null && fp === this.lastFingerprint) return; // nothing ref-relevant changed
		this.lastFingerprint = fp;
		// Called through falahRef rather than passed unbound: Falah's ref api is an
		// object of free functions today, but a method there would lose `this`.
		const falahRef = getFalah().ref;
		this.index = buildIndex(contents, (text) => falahRef.findReferences(text));
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
