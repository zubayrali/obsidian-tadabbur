import { describe, expect, it } from "vitest";
import { buildIndex, expandVerseKeys } from "./index";
import type { FoundReference, QuranRef } from "../../falah-api";

const q = (surah: number, ayah: number, toAyah?: number): QuranRef => ({
	kind: "quran",
	surah,
	ayah,
	...(toAyah !== undefined ? { toAyah } : {}),
});

// ponytail: minimal stand-in for Falah's real ref.ts `findReferences` — only
// quran links (single ayah or range), the only shapes these tests use (no
// hadith, no bounds validation, no word offsets). Falah's ref.ts has its own
// tests.
function findReferences(text: string): FoundReference[] {
	const out: FoundReference[] = [];
	const re = /\[([^\]\n]*)\]\((falah:\/\/quran\/(\d+)\/(\d+)(?:-(\d+))?)\)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) {
		const ref: QuranRef = { kind: "quran", surah: Number(m[3]), ayah: Number(m[4]) };
		if (m[5] !== undefined) ref.toAyah = Number(m[5]);
		out.push({ index: m.index, match: m[0]!, label: m[1]!, uri: m[2]!, ref });
	}
	return out;
}

describe("expandVerseKeys", () => {
	it("expands a single verse and a range", () => {
		expect(expandVerseKeys(q(2, 255))).toEqual(["2:255"]);
		expect(expandVerseKeys(q(2, 255, 256))).toEqual(["2:255", "2:256"]);
	});
	it("keys a hadith ref by collection:number", () => {
		expect(expandVerseKeys({ kind: "hadith", collection: "bukhari", number: "1" })).toEqual(["bukhari:1"]);
	});
});

describe("buildIndex", () => {
	const callout = `> [!quran] [Al-Baqarah 2:255](falah://quran/2/255)\n> arabic\n> translation`;
	const inline = `See [Aṭ-Ṭalāq 65:3](falah://quran/65/3) for more.`;

	it("ranks a callout ref as a reflection and an inline ref as a mention", () => {
		const idx = buildIndex(
			[
				{ path: "Journal/a.md", content: callout },
				{ path: "Journal/b.md", content: inline },
			],
			findReferences
		);
		expect(idx.reflectionsFor("2:255").map((l) => l.path)).toEqual(["Journal/a.md"]);
		expect(idx.mentionsFor("2:255")).toEqual([]);
		expect(idx.mentionsFor("65:3").map((l) => l.path)).toEqual(["Journal/b.md"]);
		expect(idx.reflectionsFor("65:3")).toEqual([]);
	});

	it("registers a range ref under every verse it covers", () => {
		const idx = buildIndex(
			[{ path: "d.md", content: `> [!quran] [x](falah://quran/94/5-6)\n> body` }],
			findReferences
		);
		expect(idx.count("94:5")).toBe(1);
		expect(idx.count("94:6")).toBe(1);
	});

	it("connects verses co-cited in the same note, weighted by note count", () => {
		const idx = buildIndex(
			[
				{ path: "one.md", content: `${callout}\n\n${inline}` },
				{ path: "two.md", content: `> [!quran] [x](falah://quran/2/255)\n\n${inline}` },
			],
			findReferences
		);
		expect(idx.connectionsFor("2:255")).toEqual([{ key: "65:3", weight: 2 }]);
		expect(idx.connectionsFor("65:3")).toEqual([{ key: "2:255", weight: 2 }]);
	});
});
