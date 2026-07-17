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
