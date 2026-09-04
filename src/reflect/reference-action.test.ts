import type { App } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TadabburSettings } from "../settings";

const mocks = vi.hoisted(() => ({
	getFalah: vi.fn(),
	openReflect: vi.fn(),
	logMessage: vi.fn(),
}));

vi.mock("../falah-runtime", () => ({ getFalah: mocks.getFalah }));
vi.mock("./capture", () => ({ openReflect: mocks.openReflect }));
vi.mock("../log", () => ({ logMessage: mocks.logMessage }));

import { reflectReferenceAction } from "./reference-action";

describe("reflectReferenceAction", () => {
	const app = {} as App;
	const settings: TadabburSettings = {
		reflectionDestination: "ask",
		reflectionFolder: "Tadabbur",
		dailyNoteHeading: "Tadabbur",
		reflectionPreset: "three-line",
	};
	const getSettings = () => settings;

	beforeEach(() => vi.clearAllMocks());

	it("does not offer reflection for hadith references", () => {
		const action = reflectReferenceAction(app, getSettings);
		expect(action.items({ kind: "hadith", collection: "bukhari", number: "1" })).toEqual([]);
	});

	it("loads a Quran verse and opens reflection capture", async () => {
		const verse = { arabic: "الحمد لله", translation: "All praise is for Allah" };
		mocks.getFalah.mockReturnValue({ getVerseText: vi.fn().mockResolvedValue(verse) });
		const action = reflectReferenceAction(app, getSettings);
		const [item] = await action.items({ kind: "quran", surah: 1, ayah: 2 });

		expect(item?.title).toBeTruthy();
		await item?.onClick?.();
		expect(mocks.openReflect).toHaveBeenCalledWith(
			app,
			{ surah: 1, ayah: 2, ...verse },
			settings,
		);
		expect(mocks.logMessage).not.toHaveBeenCalled();
	});

	it("reports missing verse text without opening capture", async () => {
		mocks.getFalah.mockReturnValue({ getVerseText: vi.fn().mockResolvedValue(undefined) });
		const action = reflectReferenceAction(app, getSettings);
		const [item] = await action.items({ kind: "quran", surah: 2, ayah: 255 });

		await item?.onClick?.();
		expect(mocks.openReflect).not.toHaveBeenCalled();
		expect(mocks.logMessage).toHaveBeenCalledWith(expect.any(String), "error");
	});
});
