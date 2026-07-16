// Resolves and holds the live Falah API. Pure helpers receive falah.ref via
// params (kept testable); non-pure modules read the singleton.
import type { App } from "obsidian";
import type { FalahApi } from "./falah-api";

export const REQUIRED_FALAH_API = 3;

let current: FalahApi | undefined;
export function setFalah(api: FalahApi | undefined): void { current = api; }
export function getFalah(): FalahApi {
	if (!current) throw new Error("Falah API not available");
	return current;
}
export function resolveFalah(app: App): FalahApi | undefined {
	const api = (app as unknown as { plugins: { plugins: Record<string, { api?: FalahApi }> } })
		.plugins.plugins["falah"]?.api;
	return api && api.version >= REQUIRED_FALAH_API ? api : undefined;
}
