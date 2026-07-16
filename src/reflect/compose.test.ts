import { describe, expect, it } from "vitest";
import { composeEntry, mergeUnique, perAyahNotePath, spliceUnderHeading } from "./compose";
import type { IslamicReference, QuranRef, RenderedText } from "../falah-api";

const ref: QuranRef = { kind: "quran", surah: 2, ayah: 255 };

// ponytail: minimal stand-in for Falah's real ref.ts `toCallout` — only the
// single-ayah quran + arabic/translation shape these tests use (no hadith, no
// ranges, no attribution). Falah's ref.ts has its own tests.
const toCallout = (r: IslamicReference, text?: RenderedText): string => {
	if (r.kind !== "quran") throw new Error("fake toCallout: hadith unused in these tests");
	const lines = [`> [!quran] [Quran ${r.surah}:${r.ayah}](falah://quran/${r.surah}/${r.ayah})`];
	if (text?.arabic) lines.push(`> ${text.arabic.trim()}`);
	if (text?.translation) lines.push(`> ${text.translation.trim()}`);
	return lines.join("\n");
};

describe("composeEntry", () => {
	it("puts the verse callout above the body", () => {
		const out = composeEntry(ref, { arabic: "AR", translation: "TR" }, "my reflection", toCallout);
		expect(out).toBe(
			"> [!quran] [Quran 2:255](falah://quran/2/255)\n> AR\n> TR\n\nmy reflection"
		);
	});
	it("omits the body when empty", () => {
		expect(composeEntry(ref, { arabic: "AR" }, "  ", toCallout)).toBe(
			"> [!quran] [Quran 2:255](falah://quran/2/255)\n> AR"
		);
	});
});

describe("spliceUnderHeading", () => {
	it("appends under an existing heading", () => {
		const out = spliceUnderHeading("## Tadabbur\n", "Tadabbur", "ENTRY", "b1");
		expect(out).toContain("## Tadabbur");
		expect(out).toContain("ENTRY");
		expect(out).toContain("^b1");
		expect(out.indexOf("## Tadabbur")).toBeLessThan(out.indexOf("ENTRY"));
	});
	it("creates the heading when absent", () => {
		const out = spliceUnderHeading("Some note.\n", "Tadabbur", "ENTRY", "b1");
		expect(out).toContain("Some note.");
		expect(out).toContain("## Tadabbur");
		expect(out.indexOf("Some note.")).toBeLessThan(out.indexOf("## Tadabbur"));
	});
	it("dedups when the block id is already present", () => {
		const existing = "## Tadabbur\n\nOLD\n^b1\n";
		expect(spliceUnderHeading(existing, "Tadabbur", "ENTRY", "b1")).toBe(existing);
	});
	it("does not treat a block id that is a prefix of an existing one as a duplicate", () => {
		const existing = "## Tadabbur\n\nOLD\n^tadabbur-2-255\n";
		const out = spliceUnderHeading(existing, "Tadabbur", "NEW ENTRY", "tadabbur-2-25");
		expect(out).toContain("^tadabbur-2-255");
		expect(out).toContain("NEW ENTRY");
		expect(out).toContain("^tadabbur-2-25\n");
	});
});

describe("mergeUnique", () => {
	it("unions without duplicates, preserving order", () => {
		expect(mergeUnique(["2:255"], ["2:255", "65:3"])).toEqual(["2:255", "65:3"]);
	});
});

describe("perAyahNotePath", () => {
	it("builds folder/surah-ayah.md", () => {
		expect(perAyahNotePath("Tadabbur", 2, 255)).toBe("Tadabbur/2-255.md");
	});
});
