import { defineConfig } from "vitest/config";

// "obsidian" ships types only (package.json "main" is empty) so it can never
// resolve as a real ESM module under Vite/Node. Any test whose import graph
// reaches a file with a VALUE import from "obsidian" (i18n/index.ts's
// getLanguage, and settings-helpers.ts through it) needs a stand-in; alias the
// bare specifier to a minimal stub rather than relying on Vitest's `__mocks__`
// auto-mock convention (which requires an explicit `vi.mock("obsidian")` per
// test file). Same pattern as the sibling Falah repo's vitest.config.ts, but
// pathed via import.meta.dirname instead of node:path + __dirname: this repo
// lints its config files, and obsidianmd/no-nodejs-modules (correctly, for
// plugin source) rejects a "node:path" import.
export default defineConfig({
	resolve: {
		alias: {
			obsidian: `${import.meta.dirname}/test/obsidian-stub.ts`,
		},
	},
});
