import { Notice, Plugin } from "obsidian";
import { resolveFalah, setFalah, REQUIRED_FALAH_API } from "./falah-runtime";
import type { FalahApi, VerseContext } from "./falah-api";
import { ReflectionIndexService } from "./data/reflections/service";
import { reflectVerseAction } from "./reflect/action";
import { renderReflectionStrip } from "./reflect/strip";
import { TadabburSettingTab, DEFAULT_SETTINGS, type TadabburSettings } from "./settings";
import { createReflectionsBase } from "./base";

export default class TadabburPlugin extends Plugin {
	settings: TadabburSettings = { ...DEFAULT_SETTINGS };
	index!: ReflectionIndexService;
	private offVerseAction?: () => void;
	private offDecorator?: () => void;

	async onload(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
		// Falah may load after us; resolve now, else retry once the layout is ready.
		const falah = resolveFalah(this.app);
		if (falah) return this.activate(falah);
		this.app.workspace.onLayoutReady(() => {
			const late = resolveFalah(this.app);
			if (late) this.activate(late);
			else new Notice(`Tadabbur requires the Falah plugin (API ≥ ${REQUIRED_FALAH_API}). Install/enable Falah and reload.`);
		});
	}

	private activate(falah: FalahApi): void {
		setFalah(falah);

		this.index = new ReflectionIndexService(this.app);
		this.register(() => this.index.dispose());
		this.app.workspace.onLayoutReady(() => void this.index.scanAll());

		// Obsidian's vault.on has per-literal overloads that don't distribute
		// over a union, so a for...of over the event names doesn't type-check.
		// Unrolled into four explicit registrations (same fix as Phase 3a).
		this.registerEvent(this.app.vault.on("modify", () => this.index.scheduleRescan()));
		this.registerEvent(this.app.vault.on("create", () => this.index.scheduleRescan()));
		this.registerEvent(this.app.vault.on("delete", () => this.index.scheduleRescan()));
		this.registerEvent(this.app.vault.on("rename", () => this.index.scheduleRescan()));

		this.offVerseAction = falah.registerVerseAction(reflectVerseAction(this.app, () => this.settings));
		this.offDecorator = falah.registerAyahRowDecorator((row, ctx: VerseContext) =>
			renderReflectionStrip(this.index, this.app, row, ctx.ayahKey)
		);
		this.register(() => {
			this.offVerseAction?.();
			this.offDecorator?.();
		});

		this.addSettingTab(new TadabburSettingTab(this.app, this));
		this.addCommand({
			id: "create-reflections-base",
			name: "Create reflections base",
			callback: () => void createReflectionsBase(this.app),
		});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
