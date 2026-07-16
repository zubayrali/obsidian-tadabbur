import { describe, expect, it } from "vitest";
import { buildIndex, expandVerseKeys } from "./index";
import type { FoundReference, IslamicReference, QuranRef } from "../../falah-api";

const q = (surah: number, ayah: number, toAyah?: number): QuranRef => ({
	kind: "quran",
	surah,
	ayah,
	...(toAyah !== undefined ? { toAyah } : {}),
});

// Faithful fake of Falah's real ref.ts `findReferences`/`parseRefUri` (see
// obsidian-falah/src/ref.ts): same link regex, same surah/ayah bounds
// validation (1-114 / 1-286), same hadith collection/number validation. Kept
// in sync with the real implementation so this pure suite stays meaningful
// without importing Falah source.
function int(s: string): number | null {
	return /^\d+$/.test(s) ? parseInt(s, 10) : null;
}
function validQuran(surah: number, ayah: number, toAyah?: number): boolean {
	if (surah < 1 || surah > 114 || ayah < 1 || ayah > 286) return false;
	if (toAyah !== undefined && (toAyah < ayah || toAyah > 286)) return false;
	return true;
}
function parseRefUri(uri: string): IslamicReference | null {
	const m = /^falah:\/\/(quran|hadith)\/([^?#\s]+)(?:\?([^#\s]*))?$/.exec(uri.trim());
	if (!m) return null;
	const parts = m[2]!.split("/").filter(Boolean);
	if (parts.length !== 2) return null;

	if (m[1] === "quran") {
		const surah = int(parts[0]!);
		const range = /^(\d+)(?:-(\d+))?$/.exec(parts[1]!);
		if (surah === null || !range) return null;
		const ayah = parseInt(range[1]!, 10);
		const toAyah = range[2] ? parseInt(range[2], 10) : undefined;
		if (!validQuran(surah, ayah, toAyah)) return null;
		const ref: { kind: "quran"; surah: number; ayah: number; toAyah?: number; fromWord?: number; toWord?: number } = {
			kind: "quran",
			surah,
			ayah,
		};
		if (toAyah !== undefined && toAyah !== ayah) ref.toAyah = toAyah;
		if (m[3]) {
			const query = new URLSearchParams(m[3]);
			const fromWord = query.get("fromWord");
			const toWord = query.get("toWord");
			if (fromWord !== null) {
				const n = int(fromWord);
				if (n === null || n < 1) return null;
				ref.fromWord = n;
			}
			if (toWord !== null) {
				const n = int(toWord);
				if (n === null || n < (ref.fromWord ?? 1)) return null;
				ref.toWord = n;
			}
		}
		return ref;
	}

	const collection = parts[0]!.toLowerCase();
	const number = parts[1]!.toLowerCase();
	if (!/^[a-z][a-z0-9_]*$/.test(collection) || !/^\d+[a-z]?$/.test(number)) return null;
	return { kind: "hadith", collection, number };
}
function findReferences(text: string): FoundReference[] {
	const out: FoundReference[] = [];
	const re = /\[([^\]\n]*)\]\((falah:\/\/[^\s)]+)\)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) {
		const ref = parseRefUri(m[2]!);
		if (ref) out.push({ index: m.index, match: m[0]!, label: m[1]!, uri: m[2]!, ref });
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
