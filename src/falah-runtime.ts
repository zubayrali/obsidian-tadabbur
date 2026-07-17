// Resolves and holds the live Falah API. Pure helpers receive falah.ref via
// params (kept testable); non-pure modules read the singleton.
import type { App } from "obsidian";
import type { FalahApi } from "./falah-api";

export const REQUIRED_FALAH_API = 4;
export const FALAH_PLUGIN_ID = "falah";
export const FALAH_URL = "https://github.com/zubayrali/obsidian-falah";

/** Is Falah installed and enabled at all? Load-order independent: `enabledPlugins`
 *  comes from config and is populated before any plugin's onload runs, so this is
 *  answerable in our constructor. Distinct from resolveFalah, which asks the later
 *  question "has Falah's onload run and published its API yet?". */
export function isFalahEnabled(app: App): boolean {
	const plugins = (app as unknown as { plugins?: { enabledPlugins?: Set<string> } }).plugins;
	return plugins?.enabledPlugins?.has(FALAH_PLUGIN_ID) ?? false;
}

let current: FalahApi | undefined;
export function setFalah(api: FalahApi | undefined): void { current = api; }
export function getFalah(): FalahApi {
	if (!current) throw new Error("Falah API not available");
	return current;
}
export function resolveFalah(app: App): FalahApi | undefined {
	const api = (app as unknown as { plugins: { plugins: Record<string, { api?: FalahApi }> } })
		.plugins.plugins[FALAH_PLUGIN_ID]?.api;
	return api && api.version >= REQUIRED_FALAH_API ? api : undefined;
}
