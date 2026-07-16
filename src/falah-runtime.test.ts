import { describe, expect, it } from "vitest";
import { resolveFalah } from "./falah-runtime";
import type { App } from "obsidian";

const appWith = (api: unknown): App =>
	({ plugins: { plugins: { falah: { api } } } } as unknown as App);

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
