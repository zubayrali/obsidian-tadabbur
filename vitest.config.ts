import path from "node:path";
import { defineConfig } from "vitest/config";

// "obsidian" ships types only (package.json "main" is empty) so it can never
// resolve as a real ESM module under Vite/Node. Any test whose import graph
// reaches a file with a VALUE import from "obsidian" (i18n/index.ts's
// getLanguage, and settings-helpers.ts through it) needs a stand-in; alias the
// bare specifier to a minimal stub rather than relying on Vitest's `__mocks__`
// auto-mock convention (which requires an explicit `vi.mock("obsidian")` per
// test file). Mirrors the sibling Falah repo's vitest.config.ts.
export default defineConfig({
	resolve: {
		alias: {
			obsidian: path.resolve(__dirname, "test/obsidian-stub.ts"),
		},
	},
});
