// Reflection capture: a modal to pick a scaffold + write a reflection, and the
// destination writers. Obsidian-touching (Modal, TFile, moment, frontmatter).
// The pure string work lives in compose.ts; this file only orchestrates I/O.

import { Modal, Setting, TFile, moment, normalizePath } from "obsidian";
import type { App } from "obsidian";
import type { VerseContext, IslamicReference, RenderedText } from "../falah-api";
import type { TadabburSettings } from "../settings";
import { getFalah } from "../falah-runtime";
import { composeEntry, mergeUnique, perAyahNotePath, spliceUnderHeading } from "./compose";
import { PROMPT_SCAFFOLDS, formatScaffold, scaffoldById } from "./prompts";
import { logMessage } from "../log";
import { t } from "../i18n";

type Destination = TadabburSettings["reflectionDestination"];

/** Entry point invoked by the reflect verse action. */
export function openReflect(app: App, ctx: VerseContext, settings: TadabburSettings): void {
	new ReflectModal(app, ctx, settings).open();
}

class ReflectModal extends Modal {
	private presetId: string;
	private destination: Destination;
	private body = "";
	private themes = "";

	constructor(app: App, private ctx: VerseContext, private settings: TadabburSettings) {
		super(app);
		this.presetId = settings.reflectionPreset;
		this.destination = settings.reflectionDestination;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: t().captureHeading(this.ctx.surah, this.ctx.ayah) });

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

		if (this.destination === "ask") {
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
					if (await writeReflection(this.app, this.ctx, this.body, this.destination, themes, this.settings))
						this.close();
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

function verseRef(ctx: VerseContext): IslamicReference {
	return { kind: "quran", surah: ctx.surah, ayah: ctx.ayah };
}

async function writeReflection(
	app: App,
	ctx: VerseContext,
	body: string,
	destination: Destination,
	themes: string[],
	settings: TadabburSettings
): Promise<boolean> {
	const ref = verseRef(ctx);
	const text: RenderedText = { arabic: ctx.arabic, translation: ctx.translation };
	const entry = composeEntry(ref, text, body, getFalah().ref.toCallout);
	const blockId = `tadabbur-${ctx.surah}-${ctx.ayah}-${Date.now().toString(36)}`;

	try {
		if (destination === "daily-note") {
			const path = dailyNotePath(app);
			const seed = await dailyNoteTemplateSeed(app, path);
			await appendToFile(app, path, settings.dailyNoteHeading, entry, blockId, ctx, themes, seed);
		} else {
			await appendToFile(
				app,
				normalizePath(perAyahNotePath(settings.reflectionFolder, ctx.surah, ctx.ayah)),
				"Reflections",
				entry,
				blockId,
				ctx,
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

// `typeof Moment` (obsidian's re-export) loses its call signature under this
// project's moduleResolution: "Bundler" — a minimal typed cast, not `any`.
function now(): { format(fmt: string): string } {
	return (moment as unknown as () => { format(fmt: string): string })();
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

/** Ensure the file exists, splice the entry under the heading, stamp frontmatter. */
async function appendToFile(
	app: App,
	path: string,
	heading: string,
	entry: string,
	blockId: string,
	ctx: VerseContext,
	themes: string[],
	seed = ""
): Promise<void> {
	const { vault, fileManager } = app;
	let file = vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) {
		const dir = path.split("/").slice(0, -1).join("/");
		if (dir && !vault.getAbstractFileByPath(dir)) await vault.createFolder(dir).catch(() => {});
		file = await vault.create(path, seed);
	}
	const tfile = file as TFile;
	const content = await vault.read(tfile);
	await vault.modify(tfile, spliceUnderHeading(content, heading, entry, blockId));
	// Callout (in body) feeds the reader's reference index; frontmatter feeds Bases.
	// Best-effort: the body write above already succeeded and is the source of
	// truth, so a frontmatter failure here must not surface as a save failure
	// (that would leave the modal open and invite a duplicate re-submit).
	try {
		await fileManager.processFrontMatter(tfile, (fm) => {
			fm.verses = mergeUnique(Array.isArray(fm.verses) ? fm.verses : fm.verses ? [fm.verses] : [], [
				`${ctx.surah}:${ctx.ayah}`,
			]);
			if (!Array.isArray(fm.tags)) fm.tags = fm.tags ? [fm.tags] : [];
			if (!fm.tags.includes("tadabbur")) fm.tags.push("tadabbur");
			if (themes.length)
				fm.themes = mergeUnique(Array.isArray(fm.themes) ? fm.themes : fm.themes ? [fm.themes] : [], themes);
		});
	} catch (e) {
		console.warn("Tadabbur: could not stamp reflection frontmatter", e);
	}
}
