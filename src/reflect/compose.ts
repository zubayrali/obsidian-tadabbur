// Pure string builders for reflection writes. NO "obsidian" import — the
// Obsidian file writers (capture.ts) call these. spliceUnderHeading is the one
// parser here, so it carries tests.

import type { IslamicReference, RenderedText } from "../falah-api";

export function composeEntry(
	ref: IslamicReference,
	text: RenderedText,
	body: string,
	toCallout: (ref: IslamicReference, text?: RenderedText) => string
): string {
	const callout = toCallout(ref, text);
	const trimmed = body.trim();
	return trimmed ? `${callout}\n\n${trimmed}` : callout;
}

// Generic over the element type: frontmatter callers hand us `unknown[]` (a
// hand-edited note can hold anything), and coercing to string there would
// rewrite the user's values. The logic never inspects the elements.
export function mergeUnique<T>(existing: T[], add: T[]): T[] {
	const out: T[] = [...existing];
	for (const v of add) if (!out.includes(v)) out.push(v);
	return out;
}

export function perAyahNotePath(folder: string, surah: number, ayah: number): string {
	return `${folder}/${surah}-${ayah}.md`;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Append `entry` (stamped with `^blockId`) to the section body under `heading`,
 *  creating the heading at EOF if absent. Dedups: if `^blockId` already exists
 *  anywhere in the content, returns it unchanged. */
export function spliceUnderHeading(
	content: string,
	heading: string,
	entry: string,
	blockId?: string
): string {
	if (blockId && new RegExp(`\\^${escapeRegExp(blockId)}(?![\\w-])`).test(content)) return content;
	const stamped = blockId ? `${entry}\n^${blockId}` : entry;

	const lines = content.split("\n");
	const headingRe = new RegExp(`^(#{1,6})\\s+${escapeRegExp(heading)}\\s*$`);
	let headingIdx = -1;
	let headingLevel = 0;
	for (let i = 0; i < lines.length; i++) {
		const m = headingRe.exec(lines[i]!);
		if (m) {
			headingIdx = i;
			headingLevel = m[1]!.length;
			break;
		}
	}

	if (headingIdx === -1) {
		const sep = content === "" || content.endsWith("\n") ? "" : "\n";
		const lead = content === "" ? "" : "\n";
		return `${content}${sep}${lead}## ${heading}\n\n${stamped}\n`;
	}

	// End of section = next heading at the same or higher level, else EOF.
	let end = lines.length;
	for (let i = headingIdx + 1; i < lines.length; i++) {
		const hm = /^(#{1,6})\s+/.exec(lines[i]!);
		if (hm && hm[1]!.length <= headingLevel) {
			end = i;
			break;
		}
	}
	let insertAt = end;
	while (insertAt > headingIdx + 1 && lines[insertAt - 1]!.trim() === "") insertAt--;
	lines.splice(insertAt, 0, "", stamped);
	return lines.join("\n");
}

/** The block to insert at a cursor: the entry plus its block id, padded so it
 *  never glues onto text already on the cursor's line — on either side.
 *
 *  `before`/`after` are the cursor line's text either side of the cursor.
 *  editor.replaceRange with no `to` is a pure insertion, so text after the cursor
 *  would otherwise land on the ^blockId line, corrupting it: a block id must end
 *  its line for Obsidian to resolve it.
 *
 *  `entry` always carries its callout (composeEntry builds it) — never degrade to
 *  a bare link the way Falah's insertReference does on a non-empty line. The
 *  reflection index splits reflections from mentions on callout-ness alone, so a
 *  bare link would be silently filed as a mention and vanish from the verse's
 *  reflections. */
export function composeCursorBlock(entry: string, blockId: string, before: string, after: string): string {
	const lead = before.trim() === "" ? "" : "\n\n";
	const trail = after.trim() === "" ? "" : "\n\n";
	return `${lead}${entry}\n^${blockId}${trail}`;
}
