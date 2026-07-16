// Pure normalizers for the settings tab's text inputs. NO "obsidian" import —
// the settings UI is untestable, but the rules that stop silent
// misconfiguration are, so they live here.

const DEFAULT_HEADING = "Tadabbur";
const DEFAULT_FOLDER = "Tadabbur";

export interface Cleaned {
	value: string;
	/** Set when we changed what was typed — the UI shows it so the correction
	 *  isn't silent. */
	note?: string;
}

/** A heading setting wants the heading TEXT, not its Markdown. Someone typing
 *  "## Tadabbur" would otherwise have us hunt for a heading whose text is
 *  literally "## Tadabbur", never match it, and create `## ## Tadabbur`. */
export function cleanHeading(raw: string): Cleaned {
	const trimmed = raw.trim();
	const stripped = trimmed.replace(/^#+\s*/, "").trim();
	if (!stripped) return { value: DEFAULT_HEADING, note: `Can't be empty — using “${DEFAULT_HEADING}”.` };
	if (stripped !== trimmed) return { value: stripped, note: `Just the text, no “#” — using “${stripped}”.` };
	return { value: stripped };
}

/** Folder paths: tolerate what people actually type (stray slashes, a trailing
 *  .md) rather than silently writing somewhere unexpected. */
export function cleanFolder(raw: string): Cleaned {
	const trimmed = raw.trim().replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
	if (!trimmed) return { value: DEFAULT_FOLDER, note: `Can't be empty — using “${DEFAULT_FOLDER}”.` };
	if (/\.md$/i.test(trimmed)) {
		const fixed = trimmed.replace(/\.md$/i, "").replace(/\/+$/, "");
		return {
			value: fixed || DEFAULT_FOLDER,
			note: "That's a folder, not a note — dropped the “.md”.",
		};
	}
	return { value: trimmed };
}
