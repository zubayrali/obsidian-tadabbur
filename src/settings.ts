import { Plugin, PluginSettingTab, Setting, TFolder, type App } from "obsidian";
import { PROMPT_SCAFFOLDS } from "./reflect/prompts";
import { perAyahNotePath } from "./reflect/compose";
import { dailyNotePath, dailyNoteOptions, dailyNotesEnabled } from "./reflect/capture";
import { cleanHeading, cleanFolder } from "./settings-helpers";

export interface TadabburSettings {
	reflectionDestination: "per-ayah" | "daily-note" | "ask";
	reflectionFolder: string;
	dailyNoteHeading: string;
	reflectionPreset: string;
}
export const DEFAULT_SETTINGS: TadabburSettings = {
	reflectionDestination: "ask",
	reflectionFolder: "Tadabbur",
	dailyNoteHeading: "Tadabbur",
	reflectionPreset: "three-line",
};

/** Minimal shape TadabburSettingTab needs from the plugin; TadabburPlugin
 *  satisfies it structurally, so this file needn't import ./main. */
export interface TadabburSettingsHost extends Plugin {
	settings: TadabburSettings;
	saveSettings(): Promise<void>;
}

export class TadabburSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: TadabburSettingsHost
	) {
		super(app, plugin);
	}

	private folderPaths(): string[] {
		return this.app.vault
			.getAllLoadedFiles()
			.filter((f): f is TFolder => f instanceof TFolder)
			.map((f) => f.path)
			.filter((p) => p !== "/")
			.sort();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const s = this.plugin.settings;
		const dest = s.reflectionDestination;

		containerEl.createEl("h3", { text: "Reflections" });

		new Setting(containerEl)
			.setName("Save reflections to")
			.setDesc("Where a reflection is written. “Ask each time” prompts in the capture dialog.")
			.addDropdown((d) =>
				d
					.addOption("ask", "Ask each time")
					.addOption("per-ayah", "Per-ayah note")
					.addOption("daily-note", "Today's daily note")
					.setValue(dest)
					.onChange(async (v) => {
						s.reflectionDestination = v as TadabburSettings["reflectionDestination"];
						await this.plugin.saveSettings();
						this.display(); // only the relevant destination's settings should show
					})
			);

		if (dest === "per-ayah" || dest === "ask") this.renderPerAyahFolder(containerEl);
		if (dest === "daily-note" || dest === "ask") this.renderDailyNoteHeading(containerEl);

		new Setting(containerEl)
			.setName("Default reflection scaffold")
			.setDesc("The structure the capture box starts with. You can change it per reflection.")
			.addDropdown((d) => {
				for (const p of PROMPT_SCAFFOLDS) d.addOption(p.id, p.name);
				d.setValue(s.reflectionPreset).onChange(async (v) => {
					s.reflectionPreset = v;
					await this.plugin.saveSettings();
				});
			});
	}

	private renderPerAyahFolder(containerEl: HTMLElement): void {
		const s = this.plugin.settings;
		const setting = new Setting(containerEl).setName("Per-ayah reflection folder");
		const preview = setting.descEl.createDiv({ cls: "tadabbur-hint" });
		const show = (folder: string, note?: string) => {
			preview.empty();
			preview.createSpan({ text: `Example: ${perAyahNotePath(folder, 2, 255)}` });
			if (note) preview.createDiv({ cls: "tadabbur-hint-warn", text: note });
		};
		// Preview the value we'd actually write, not the raw stored string — a
		// setting saved before these normalizers existed may still be irregular.
		show(cleanFolder(s.reflectionFolder).value);

		setting.addText((t) => {
			t.setPlaceholder(DEFAULT_SETTINGS.reflectionFolder).setValue(s.reflectionFolder);
			attachFolderSuggestions(t.inputEl, this.folderPaths());
			t.onChange(async (raw) => {
				const { value, note } = cleanFolder(raw);
				s.reflectionFolder = value;
				show(value, note);
				await this.plugin.saveSettings();
			});
		});
	}

	private renderDailyNoteHeading(containerEl: HTMLElement): void {
		const s = this.plugin.settings;
		const setting = new Setting(containerEl).setName("Daily-note heading");
		const preview = setting.descEl.createDiv({ cls: "tadabbur-hint" });

		// Read the user's real Daily Notes config so this shows where reflections
		// actually land, not where we guess they might.
		const enabled = dailyNotesEnabled(this.app);
		const { template } = dailyNoteOptions(this.app);
		const show = (heading: string, note?: string) => {
			preview.empty();
			preview.createSpan({ text: `Appended under “## ${heading}” in ${dailyNotePath(this.app)}` });
			if (template) preview.createDiv({ text: `New days are seeded from your template: ${template}` });
			if (!enabled) {
				preview.createDiv({
					cls: "tadabbur-hint-warn",
					text: "Core Daily Notes is off, so there's no folder or format to follow — reflections would land at the vault root. Enable Daily Notes to control this.",
				});
			}
			if (note) preview.createDiv({ cls: "tadabbur-hint-warn", text: note });
		};
		show(cleanHeading(s.dailyNoteHeading).value);

		setting.addText((t) =>
			t
				.setPlaceholder(DEFAULT_SETTINGS.dailyNoteHeading)
				.setValue(s.dailyNoteHeading)
				.onChange(async (raw) => {
					const { value, note } = cleanHeading(raw);
					s.dailyNoteHeading = value;
					show(value, note);
					await this.plugin.saveSettings();
				})
		);
	}
}

/** Native datalist autocomplete — the vault's folders, no dependency and no
 *  custom suggest widget. */
function attachFolderSuggestions(input: HTMLInputElement, folders: string[]): void {
	if (!folders.length) return;
	const id = "tadabbur-folders";
	input.setAttr("list", id);
	const list = input.parentElement?.createEl("datalist");
	if (!list) return;
	list.id = id;
	for (const f of folders) list.createEl("option", { value: f });
}
