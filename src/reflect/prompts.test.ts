import { describe, expect, it } from "vitest";
import { PROMPT_SCAFFOLDS, formatScaffold, scaffoldById } from "./prompts";

describe("prompt scaffolds", () => {
	it("formats a scaffold as labelled empty fields", () => {
		const s = scaffoldById("three-line");
		expect(formatScaffold(s)).toBe(
			"**Summary.** \n\n**What it means to me.** \n\n**One action.** "
		);
	});
	it("ships the three-line and three-lens presets", () => {
		expect(PROMPT_SCAFFOLDS.map((s) => s.id)).toEqual(["three-line", "three-lens"]);
	});
	it("falls back to the first preset for an unknown id", () => {
		expect(scaffoldById("nope").id).toBe("three-line");
	});
});
