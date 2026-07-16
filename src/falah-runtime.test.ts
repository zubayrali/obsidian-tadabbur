import { describe, expect, it } from "vitest";
import { resolveFalah, isFalahEnabled } from "./falah-runtime";
import type { App } from "obsidian";

const appWith = (api: unknown): App =>
	({ plugins: { plugins: { falah: { api } } } } as unknown as App);

const appEnabling = (...ids: string[]): App =>
	({ plugins: { enabledPlugins: new Set(ids) } } as unknown as App);

describe("resolveFalah", () => {
	it("returns the api when version is sufficient", () => {
		const api = { version: 3 };
		expect(resolveFalah(appWith(api))).toBe(api);
	});
	it("returns undefined when Falah is absent or too old", () => {
		expect(resolveFalah({ plugins: { plugins: {} } } as unknown as App)).toBeUndefined();
		expect(resolveFalah(appWith({ version: 0 }))).toBeUndefined();
		expect(resolveFalah(appWith({ version: 1 }))).toBeUndefined();
		expect(resolveFalah(appWith({ version: 2 }))).toBeUndefined();
	});
});

describe("isFalahEnabled", () => {
	it("is true when falah is in the enabled set", () => {
		expect(isFalahEnabled(appEnabling("falah"))).toBe(true);
		expect(isFalahEnabled(appEnabling("dataview", "falah"))).toBe(true);
	});
	it("is false when falah is not enabled", () => {
		expect(isFalahEnabled(appEnabling())).toBe(false);
		expect(isFalahEnabled(appEnabling("dataview"))).toBe(false);
	});
	it("is false — never throws — when the plugins surface is missing", () => {
		// Undocumented internal; if Obsidian ever moves it we degrade to "absent"
		// rather than exploding in the constructor.
		expect(isFalahEnabled({} as App)).toBe(false);
		expect(isFalahEnabled({ plugins: {} } as unknown as App)).toBe(false);
	});
	it("does not depend on load order — enabled without a loaded api still counts", () => {
		// The whole point: enabledPlugins is config, populated before onload runs.
		const app = { plugins: { enabledPlugins: new Set(["falah"]), plugins: {} } } as unknown as App;
		expect(isFalahEnabled(app)).toBe(true);
		expect(resolveFalah(app)).toBeUndefined();
	});
});
