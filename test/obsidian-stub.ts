// Test-time stand-in for the "obsidian" package, aliased in via vitest.config.ts.
// "obsidian" ships type declarations only (package.json "main" is empty), so it
// cannot be resolved as a real module under Vite/Node — any test whose import
// graph reaches a file that imports a VALUE from "obsidian" (i18n/index.ts, and
// settings-helpers.ts through it) needs this. Same pattern as the sibling Falah
// repo's test/obsidian-stub.ts. Extend as later tasks' tests reach more of the
// Obsidian API.

/** Real Obsidian defaults this to "en"; outside Obsidian there is no configured
 *  UI language at all, so "" lets getLocale() fall through to its own default. */
export function getLanguage(): string {
	return "";
}
