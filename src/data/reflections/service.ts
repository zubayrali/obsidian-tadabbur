// Obsidian adapter over the pure incremental reflection index.

import { TFile, type App } from "obsidian";
import { IncrementalReflectionIndex, type ReflectionIndex, type RefLocation } from "./index";
import { getFalah } from "../../falah-runtime";

type PendingChange = { kind: "upsert"; file: TFile } | { kind: "remove" };

export class ReflectionIndexService implements ReflectionIndex {
	private index: IncrementalReflectionIndex | null = null;
	private timer: number | null = null;
	private listeners = new Set<() => void>();
	private pending = new Map<string, PendingChange>();

	constructor(private app: App) {}

	async scanAll(): Promise<void> {
		const files = this.app.vault.getMarkdownFiles();
		const contents = await Promise.all(files.map(async (file) => ({
			path: file.path,
			content: await this.app.vault.cachedRead(file),
		})));
		const next = new IncrementalReflectionIndex((text) => getFalah().ref.findReferences(text));
		for (const file of contents) next.upsertFile(file.path, file.content);
		this.index = next;
		this.pending.clear();
		this.emit();
	}

	scheduleFile(file: TFile): void {
		if (file.extension !== "md") return;
		this.pending.set(file.path, { kind: "upsert", file });
		this.scheduleFlush();
	}

	scheduleRemove(path: string): void {
		this.pending.set(path, { kind: "remove" });
		this.scheduleFlush();
	}

	scheduleRename(file: TFile, oldPath: string): void {
		this.pending.set(oldPath, { kind: "remove" });
		if (file.extension === "md") this.pending.set(file.path, { kind: "upsert", file });
		this.scheduleFlush();
	}

	/** Compatibility entry point for callers that do not know which file changed. */
	scheduleRescan(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(() => {
			this.timer = null;
			void this.scanAll();
		}, 400);
	}

	private scheduleFlush(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = window.setTimeout(() => {
			this.timer = null;
			void this.flushPending();
		}, 400);
	}

	private async flushPending(): Promise<void> {
		if (!this.index) {
			await this.scanAll();
			return;
		}
		const changes = [...this.pending.entries()];
		this.pending.clear();
		for (const [path, change] of changes) {
			if (change.kind === "remove") {
				this.index.removeFile(path);
				continue;
			}
			try {
				this.index.upsertFile(path, await this.app.vault.cachedRead(change.file));
			} catch (error) {
				console.warn(`Tadabbur: could not update reflection index for ${path}`, error);
			}
		}
		if (changes.length) this.emit();
	}

	private emit(): void {
		for (const callback of this.listeners) callback();
	}

	onChange(callback: () => void): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	dispose(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
		this.pending.clear();
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
