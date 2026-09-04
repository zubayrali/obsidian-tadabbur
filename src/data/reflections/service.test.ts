import { afterEach, describe, expect, it, vi } from "vitest";
import { TFile, type App } from "obsidian";
import type { FalahApi, FoundReference, QuranRef } from "../../falah-api";
import { setFalah } from "../../falah-runtime";
import { ReflectionIndexService } from "./service";

function findReferences(text: string): FoundReference[] {
	const match = /\[([^\]]+)\]\(falah:\/\/quran\/(\d+)\/(\d+)\)/.exec(text);
	if (!match) return [];
	const ref: QuranRef = { kind: "quran", surah: Number(match[2]), ayah: Number(match[3]) };
	return [{ index: match.index, match: match[0], label: match[1]!, uri: match[0], ref }];
}

function markdownFile(path: string): TFile {
	return Object.assign(new TFile(), { path });
}

afterEach(() => {
	setFalah(undefined);
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("ReflectionIndexService", () => {
	it("reads only the changed file after the initial scan", async () => {
		vi.useFakeTimers();
		vi.stubGlobal("window", { setTimeout, clearTimeout });
		const file = markdownFile("Journal/a.md");
		let content = "> [!quran] [A](falah://quran/2/255)";
		const getMarkdownFiles = vi.fn(() => [file]);
		const cachedRead = vi.fn(async () => content);
		const app = { vault: { getMarkdownFiles, cachedRead } } as unknown as App;
		setFalah({ ref: { findReferences } } as unknown as FalahApi);
		const service = new ReflectionIndexService(app);

		await service.scanAll();
		expect(service.count("2:255")).toBe(1);
		content = "> [!quran] [B](falah://quran/94/5)";
		service.scheduleFile(file);
		await vi.runAllTimersAsync();

		expect(getMarkdownFiles).toHaveBeenCalledTimes(1);
		expect(cachedRead).toHaveBeenCalledTimes(2);
		expect(service.count("2:255")).toBe(0);
		expect(service.count("94:5")).toBe(1);
	});

	it("removes deleted files without another vault read", async () => {
		vi.useFakeTimers();
		vi.stubGlobal("window", { setTimeout, clearTimeout });
		const file = markdownFile("Journal/a.md");
		const cachedRead = vi.fn(async () => "> [!quran] [A](falah://quran/2/255)");
		const app = { vault: { getMarkdownFiles: () => [file], cachedRead } } as unknown as App;
		setFalah({ ref: { findReferences } } as unknown as FalahApi);
		const service = new ReflectionIndexService(app);
		await service.scanAll();

		service.scheduleRemove(file.path);
		await vi.runAllTimersAsync();

		expect(service.count("2:255")).toBe(0);
		expect(cachedRead).toHaveBeenCalledTimes(1);
	});
});
