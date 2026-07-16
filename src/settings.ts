import { Plugin, PluginSettingTab, Setting, type App } from "obsidian";
import { PROMPT_SCAFFOLDS } from "./reflect/prompts";

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

/** Minimal shape TadabburSettingTab needs from the plugin. `saveSettings()`
 *  lands in Task 9; declared here (not imported from ./main) so tsc passes
 *  before that lands, and TadabburPlugin will satisfy it structurally. */
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

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h3", { text: "Reflections" });

		new Setting(containerEl)
			.setName("Save reflections to")
			.setDesc("Where a reflection is written. 'Ask each time' prompts in the capture dialog.")
			.addDropdown((d) =>
				d
					.addOption("ask", "Ask each time")
					.addOption("per-ayah", "Per-ayah note")
					.addOption("daily-note", "Today's daily note")
					.setValue(this.plugin.settings.reflectionDestination)
					.onChange(async (v) => {
						this.plugin.settings.reflectionDestination =
							v as TadabburSettings["reflectionDestination"];
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Per-ayah reflection folder")
			.addText((t) =>
				t
					.setPlaceholder("Tadabbur")
					.setValue(this.plugin.settings.reflectionFolder)
					.onChange(async (v) => {
						this.plugin.settings.reflectionFolder = v.trim() || "Tadabbur";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Daily-note heading")
			.setDesc("Reflections are appended under this heading in the daily note.")
			.addText((t) =>
				t
					.setPlaceholder("Tadabbur")
					.setValue(this.plugin.settings.dailyNoteHeading)
					.onChange(async (v) => {
						this.plugin.settings.dailyNoteHeading = v.trim() || "Tadabbur";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default reflection scaffold")
			.addDropdown((d) => {
				for (const s of PROMPT_SCAFFOLDS) d.addOption(s.id, s.name);
				d.setValue(this.plugin.settings.reflectionPreset).onChange(async (v) => {
					this.plugin.settings.reflectionPreset = v;
					await this.plugin.saveSettings();
				});
			});
	}
}
