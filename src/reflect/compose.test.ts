import { describe, expect, it } from "vitest";
import { composeEntry, mergeUnique, perAyahNotePath, spliceUnderHeading } from "./compose";
import type { IslamicReference, QuranRef, RenderedText } from "../falah-api";

const ref: QuranRef = { kind: "quran", surah: 2, ayah: 255 };

// Faithful fake of Falah's real ref.ts `toCallout` (see obsidian-falah/src/ref.ts):
// title line via toLabel/toUri, then `> `-prefixed arabic/translation/attribution
// lines, each whitespace-collapsed. Kept in sync with the real implementation so
// this pure suite stays meaningful without importing Falah source.
const HADITH_COLLECTION_NAMES: Record<string, string> = {
	bukhari: "Bukhari",
	muslim: "Muslim",
	abudawud: "Abu Dawud",
	tirmidhi: "Tirmidhi",
	nasai: "an-Nasa'i",
	ibnmajah: "Ibn Majah",
	malik: "Malik",
	nawawi: "Nawawi",
	qudsi: "Qudsi",
	dehlawi: "Dehlawi",
};
const collapse = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();
function toLabel(r: IslamicReference): string {
	if (r.kind === "quran") {
		return `Quran ${r.surah}:${r.ayah}${r.toAyah !== undefined ? `-${r.toAyah}` : ""}`;
	}
	const name = HADITH_COLLECTION_NAMES[r.collection] ?? r.collection.charAt(0).toUpperCase() + r.collection.slice(1);
	return `Hadith ${name} ${r.number}`;
}
function toUri(r: IslamicReference): string {
	if (r.kind === "hadith") return `falah://hadith/${r.collection}/${r.number}`;
	let uri = `falah://quran/${r.surah}/${r.ayah}`;
	if (r.toAyah !== undefined) uri += `-${r.toAyah}`;
	const q = new URLSearchParams();
	if (r.fromWord !== undefined) q.set("fromWord", String(r.fromWord));
	if (r.toWord !== undefined) q.set("toWord", String(r.toWord));
	const qs = q.toString();
	return qs ? `${uri}?${qs}` : uri;
}
const toCallout = (r: IslamicReference, text?: RenderedText): string => {
	const lines = [`> [!${r.kind}] [${toLabel(r)}](${toUri(r)})`];
	if (text?.arabic) lines.push(`> ${collapse(text.arabic)}`);
	if (text?.translation) lines.push(`> ${collapse(text.translation)}`);
	if (text?.attribution) lines.push(`> — ${collapse(text.attribution)}`);
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
