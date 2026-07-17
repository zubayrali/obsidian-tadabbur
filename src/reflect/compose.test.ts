import { describe, expect, it } from "vitest";
import { composeCursorBlock, composeEntry, mergeUnique, perAyahNotePath, spliceUnderHeading } from "./compose";
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

describe("composeCursorBlock", () => {
	const entry = "> [!quran] [Al-Baqarah 2:255](falah://quran/2/255)\n> Allah...\n\nMy reflection.";

	it("stamps the block id on its own line when the cursor line is empty on both sides", () => {
		expect(composeCursorBlock(entry, "tadabbur-2-255-abc", "", "")).toBe(`${entry}\n^tadabbur-2-255-abc`);
	});

	it("pads before the block when text precedes the cursor, so it starts its own block", () => {
		expect(composeCursorBlock(entry, "tadabbur-2-255-abc", "Hello ", "")).toBe(
			`\n\n${entry}\n^tadabbur-2-255-abc`
		);
	});

	it("pads after the block when text follows the cursor, so ^blockId still ends its line", () => {
		// `Hello /reflect world` triggers with ' world' after the cursor; without a
		// trailing pad it would land on the ^blockId line and break block resolution.
		const out = composeCursorBlock(entry, "tadabbur-2-255-abc", "Hello ", " world");
		expect(out).toBe(`\n\n${entry}\n^tadabbur-2-255-abc\n\n`);
		expect(out.split("\n").find((l) => l.includes("^tadabbur-2-255-abc"))).toBe("^tadabbur-2-255-abc");
	});

	it("pads a whitespace-only tail, not just a non-blank one", () => {
		// A line of "    " (4 spaces) with the cursor at ch 2 yields after = "  ":
		// trim() === "" would treat that as absent and leave it glued onto the
		// ^blockId line, the same defect class the lead/trail padding was meant to fix.
		const out = composeCursorBlock(entry, "tadabbur-2-255-abc", "  ", "  ");
		expect(out).toBe(`${entry}\n^tadabbur-2-255-abc\n\n`);
	});

	it("pads after the block when the cursor sits at the start of a non-empty line", () => {
		// before = "" (cursor at ch 0), after = "world" — a real user action
		// (inserting before existing text) that was previously unpinned.
		const out = composeCursorBlock(entry, "tadabbur-2-255-abc", "", "world");
		expect(out).toBe(`${entry}\n^tadabbur-2-255-abc\n\n`);
	});

	it("does not disturb the entry's leading callout", () => {
		// Only guards THIS function: it must never prepend non-whitespace before the
		// entry. The real guarantee that an entry starts with a callout lives in
		// Falah's toCallout (composeEntry injects it) and cannot be checked from here.
		// It matters because the reflection index splits reflections from mentions on
		// callout-ness alone — a bare link would be silently filed as a mention.
		const out = composeCursorBlock(entry, "id", "Hello ", "");
		expect(out.trimStart().startsWith("> [!")).toBe(true);
	});
});
