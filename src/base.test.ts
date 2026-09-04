import type { App } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ logMessage: vi.fn() }));
vi.mock("./log", () => ({ logMessage: mocks.logMessage }));

import { createReflectionsBase, REFLECTIONS_BASE } from "./base";

describe("createReflectionsBase", () => {
	beforeEach(() => vi.clearAllMocks());

	it("creates the Base once and is idempotent", async () => {
		let existing: object | null = null;
		const create = vi.fn(async (_path: string, _content: string) => {
			existing = {};
			return existing;
		});
		const app = {
			vault: {
				getAbstractFileByPath: vi.fn(() => existing),
				create,
			},
		} as unknown as App;

		await createReflectionsBase(app);
		await createReflectionsBase(app);

		expect(create).toHaveBeenCalledOnce();
		expect(create).toHaveBeenCalledWith("Reflections.base", REFLECTIONS_BASE);
		expect(mocks.logMessage).toHaveBeenNthCalledWith(1, expect.any(String), "info");
		expect(mocks.logMessage).toHaveBeenNthCalledWith(2, expect.any(String), "info");
	});
});
