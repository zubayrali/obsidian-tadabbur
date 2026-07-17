// Reflection capture: a modal to pick a scaffold + write a reflection, and the
// destination writers. Obsidian-touching (Modal, TFile, moment, frontmatter).
// The pure string work lives in compose.ts; this file only orchestrates I/O.

import { Modal, Setting, TFile, moment, normalizePath } from "obsidian";
import type { App, Editor } from "obsidian";
import type { IslamicReference, RenderedText } from "../falah-api";
import type { TadabburSettings } from "../settings";
import { getFalah } from "../falah-runtime";
import { composeCursorBlock, composeEntry, mergeUnique, perAyahNotePath, spliceUnderHeading } from "./compose";
import { PROMPT_SCAFFOLDS, formatScaffold, scaffoldById } from "./prompts";
import { logMessage } from "../log";
import { t } from "../i18n";

// "in-place" is a call-site destination, never a saved setting — it is meaningless
// from the reader, which has no editor.
type Destination = TadabburSettings["reflectionDestination"] | "in-place";

/** What a reflection needs to know about its verse. Deliberately narrower than
 *  Falah's VerseContext, which carries the reader's view and plugin — neither of
 *  which exists when reflecting from outside the reader. */
export interface ReflectTarget {
	surah: number;
	ayah: number;
	arabic: string;
	translation?: string;
}

/** An in-place write target available at THIS call site. Absent from the reader.
 *  `kind` also decides whether the user gets a Save-to choice: a cursor means they
 *  invoked an insert command, so there is nothing to ask. */
export type InPlaceTarget = { kind: "cursor"; editor: Editor; file: TFile | null };

/** Entry point invoked by the reflect verse action. */
export function openReflect(
	app: App,
	target: ReflectTarget,
	settings: TadabburSettings,
	inPlace?: InPlaceTarget
): void {
	new ReflectModal(app, target, settings, inPlace).open();
}

class ReflectModal extends Modal {
	private presetId: string;
	private destination: Destination;
	private body = "";
	private themes = "";

	constructor(
		app: App,
		private target: ReflectTarget,
		private settings: TadabburSettings,
		private inPlace?: InPlaceTarget
	) {
		super(app);
		this.presetId = settings.reflectionPreset;
		this.destination = inPlace ? "in-place" : settings.reflectionDestination;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: t().captureHeading(this.target.surah, this.target.ayah) });

		this.body = formatScaffold(scaffoldById(this.presetId));

		new Setting(contentEl).setName(t().setScaffoldName).addDropdown((d) => {
			for (const s of PROMPT_SCAFFOLDS) d.addOption(s.id, s.name);
			d.setValue(this.presetId).onChange((v) => {
				this.presetId = v;
				textarea.value = this.body = formatScaffold(scaffoldById(v));
			});
		});

		new Setting(contentEl)
			.setName(t().setThemesName)
			.setDesc(t().setThemesDesc)
			.addText((tc) => tc.setPlaceholder(t().placeholderThemes).onChange((v) => (this.themes = v)));

		if (this.destination === "ask" && !this.inPlace) {
			new Setting(contentEl).setName(t().setSaveToName).addDropdown((d) => {
				d.addOption("per-ayah", t().optionSaveToPerAyah);
				d.addOption("daily-note", t().optionSaveToDaily);
				this.destination = "per-ayah";
				d.setValue("per-ayah").onChange((v) => (this.destination = v as Destination));
			});
		}

		const textarea = contentEl.createEl("textarea", { cls: "falah-reflect-input" });
		textarea.value = this.body;
		textarea.rows = 8;
		textarea.addEventListener("input", () => (this.body = textarea.value));

		new Setting(contentEl).addButton((b) =>
			b
				.setButtonText(t().buttonSaveReflection)
				.setCta()
				.onClick(async () => {
					const themes = this.themes
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean);
					if (
						await writeReflection(
							this.app,
							this.target,
							this.body,
							this.destination,
							themes,
							this.settings,
							this.inPlace
						)
					)
						this.close();
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

function verseRef(target: ReflectTarget): IslamicReference {
	return { kind: "quran", surah: target.surah, ayah: target.ayah };
}

async function writeReflection(
	app: App,
	target: ReflectTarget,
	body: string,
	destination: Destination,
	themes: string[],
	settings: TadabburSettings,
	inPlace?: InPlaceTarget
): Promise<boolean> {
	const ref = verseRef(target);
	const text: RenderedText = { arabic: target.arabic, translation: target.translation };
	// Called through falahRef rather than passed unbound: Falah's ref api is an
	// object of free functions today, but a method there would lose `this`.
	const falahRef = getFalah().ref;
	const entry = composeEntry(ref, text, body, (r, rendered) => falahRef.toCallout(r, rendered));
	const blockId = `tadabbur-${target.surah}-${target.ayah}-${Date.now().toString(36)}`;

	try {
		if (destination === "in-place" && inPlace) {
			const { editor, file } = inPlace;
			const cursor = editor.getCursor();
			const lineIsEmpty = editor.getLine(cursor.line).trim() === "";
			editor.replaceRange(composeCursorBlock(entry, blockId, lineIsEmpty), cursor);
			if (file) await stampFrontMatter(app, file, target, themes);
			logMessage(t().noticeReflectionSaved, "info");
			return true;
		}
		if (destination === "daily-note") {
			const path = dailyNotePath(app);
			const seed = await dailyNoteTemplateSeed(app, path);
			await appendToFile(app, path, settings.dailyNoteHeading, entry, blockId, target, themes, seed);
		} else {
			await appendToFile(
				app,
				normalizePath(perAyahNotePath(settings.reflectionFolder, target.surah, target.ayah)),
				"Reflections",
				entry,
				blockId,
				target,
				themes
			);
		}
		logMessage(t().noticeReflectionSaved, "info");
		return true;
	} catch (e) {
		logMessage(t().noticeSaveReflectionFailed(e instanceof Error ? e.message : String(e)), "error");
		return false;
	}
}

export type DailyNoteOptions = { folder?: string; format?: string; template?: string };

type InternalPlugins = {
	internalPlugins?: {
		getPluginById(id: string): { enabled?: boolean; instance?: { options?: DailyNoteOptions } } | null;
	};
};

export function dailyNoteOptions(app: App): DailyNoteOptions {
	return (app as unknown as InternalPlugins).internalPlugins?.getPluginById("daily-notes")?.instance?.options ?? {};
}

/** Is core Daily Notes actually on? If not we still write a `<date>.md`, but at
 *  the vault root with default formatting — worth warning about rather than
 *  silently scattering notes. */
export function dailyNotesEnabled(app: App): boolean {
	return (app as unknown as InternalPlugins).internalPlugins?.getPluginById("daily-notes")?.enabled ?? false;
}

// Single clock accessor, narrowed to the one method we use. Obsidian's `moment`
// re-export keeps its call signature under this project's moduleResolution:
// "node", so no cast is needed to call it.
function now(): { format(fmt: string): string } {
	return moment();
}

/** Today's daily-note path from the user's core Daily Notes config. */
export function dailyNotePath(app: App): string {
	const { folder = "", format } = dailyNoteOptions(app);
	const name = `${now().format(format || "YYYY-MM-DD")}.md`;
	return normalizePath(folder ? `${folder}/${name}` : name);
}

// ponytail: expands only the core Templates tokens ({{date}}, {{time}}, {{title}},
// and the {{date:FMT}} / {{time:FMT}} forms) — it does not run Templater or any
// other templating plugin's syntax.
function expandTemplateTokens(raw: string, notePath: string): string {
	const title = notePath.split("/").pop()?.replace(/\.md$/, "") ?? "";
	const n = now();
	return raw
		.replace(/\{\{date:([^}]+)\}\}/g, (_m, fmt: string) => n.format(fmt))
		.replace(/\{\{time:([^}]+)\}\}/g, (_m, fmt: string) => n.format(fmt))
		.replace(/\{\{date\}\}/g, n.format("YYYY-MM-DD"))
		.replace(/\{\{time\}\}/g, n.format("HH:mm"))
		.replace(/\{\{title\}\}/g, title);
}

/** Seed content for a newly-created daily note, from the user's configured Daily
 *  Notes template (if any). Falls back to "" if unset, missing, or unreadable. */
async function dailyNoteTemplateSeed(app: App, notePath: string): Promise<string> {
	const { template } = dailyNoteOptions(app);
	if (!template) return "";
	const path = template.endsWith(".md") ? template : `${template}.md`;
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) return "";
	try {
		return expandTemplateTokens(await app.vault.read(file), notePath);
	} catch {
		return "";
	}
}

/** The only frontmatter keys Tadabbur stamps. Obsidian types processFrontMatter's
 *  callback param as `any`; naming the shape we reach into keeps that `any` from
 *  leaking through every read below. Values stay `unknown` — a hand-edited note
 *  can legally hold a scalar (or anything else) where we write a list. */
type ReflectionFrontMatter = { verses?: unknown; tags?: unknown; themes?: unknown };

/** Widen a frontmatter value to a list without touching the values themselves:
 *  `undefined`/empty → [], a bare scalar → [scalar], a list → itself. */
function asList(v: unknown): unknown[] {
	if (Array.isArray(v)) return v as unknown[];
	return v ? [v] : [];
}

/** Callout (in body) feeds the reader's reference index; frontmatter feeds Bases.
 *  Best-effort: the body write already succeeded and is the source of truth, so a
 *  frontmatter failure here must not surface as a save failure (that would leave
 *  the modal open and invite a duplicate re-submit). */
async function stampFrontMatter(
	app: App,
	file: TFile,
	target: ReflectTarget,
	themes: string[]
): Promise<void> {
	try {
		await app.fileManager.processFrontMatter(file, (fm: ReflectionFrontMatter) => {
			fm.verses = mergeUnique(asList(fm.verses), [`${target.surah}:${target.ayah}`]);
			const tags = asList(fm.tags);
			if (!tags.includes("tadabbur")) tags.push("tadabbur");
			fm.tags = tags;
			if (themes.length) fm.themes = mergeUnique(asList(fm.themes), themes);
		});
	} catch (e) {
		console.warn("Tadabbur: could not stamp reflection frontmatter", e);
	}
}

/** Ensure the file exists, splice the entry under the heading, stamp frontmatter. */
async function appendToFile(
	app: App,
	path: string,
	heading: string,
	entry: string,
	blockId: string,
	target: ReflectTarget,
	themes: string[],
	seed = ""
): Promise<void> {
	const { vault } = app;
	// `let file: TFile` assigned from either branch, rather than reusing the
	// AbstractFile binding and casting: vault.create already returns a TFile, so
	// the type narrows honestly and no `as TFile` is needed.
	const existing = vault.getAbstractFileByPath(path);
	let file: TFile;
	if (existing instanceof TFile) {
		file = existing;
	} else {
		const dir = path.split("/").slice(0, -1).join("/");
		if (dir && !vault.getAbstractFileByPath(dir)) await vault.createFolder(dir).catch(() => {});
		file = await vault.create(path, seed);
	}
	const content = await vault.read(file);
	await vault.modify(file, spliceUnderHeading(content, heading, entry, blockId));
	await stampFrontMatter(app, file, target, themes);
}
