import { Plugin, type App, type PluginManifest } from "obsidian";
import { resolveFalah, setFalah, isFalahEnabled, REQUIRED_FALAH_API, FALAH_URL } from "./falah-runtime";
import type { FalahApi, VerseContext } from "./falah-api";
import { ReflectionIndexService } from "./data/reflections/service";
import { reflectVerseAction } from "./reflect/action";
import { renderReflectionStrip } from "./reflect/strip";
import { TadabburSettingTab, DEFAULT_SETTINGS, type TadabburSettings } from "./settings";
import { createReflectionsBase } from "./base";
import { logMessage } from "./log";
import { t } from "./i18n";

export default class TadabburPlugin extends Plugin {
	settings: TadabburSettings = { ...DEFAULT_SETTINGS };
	index?: ReflectionIndexService;
	private offVerseAction?: () => void;
	private offDecorator?: () => void;
	private offIndexChange?: () => void;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		// Obsidian offers no way to decline being enabled — no manifest dependency
		// field, no pre-enable hook. Throwing from the constructor is the one thing
		// that makes the load fail, so the toggle doesn't stay on. (Same mechanism
		// obsidian-lifeos uses for its Dataview dependency.)
		//
		// This checks enabledPlugins, NOT the api: that set is populated from config
		// before any plugin loads, so it's load-order safe here. "Falah enabled but
		// its api not published yet" is a different question, handled in onload.
		if (!isFalahEnabled(app)) {
			logMessage(t().noticeNoFalah(FALAH_URL), "error", { durationMs: 15000 });
			throw new Error("Tadabbur requires the Falah plugin. Install and enable Falah, then enable Tadabbur.");
		}
	}

	async onload(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
		this.register(() => this.detach());

		// Obsidian's vault.on has per-literal overloads that don't distribute
		// over a union, so a for...of over the event names doesn't type-check.
		// Unrolled into four explicit registrations (same fix as Phase 3a).
		// Plugin-lifetime (registered once, not re-wired per attach/detach cycle);
		// guarded with `?.` because Falah — and so this.index — may not exist yet,
		// or may never arrive at all.
		this.registerEvent(this.app.vault.on("modify", () => this.index?.scheduleRescan()));
		this.registerEvent(this.app.vault.on("create", () => this.index?.scheduleRescan()));
		this.registerEvent(this.app.vault.on("delete", () => this.index?.scheduleRescan()));
		this.registerEvent(this.app.vault.on("rename", () => this.index?.scheduleRescan()));
		this.app.workspace.onLayoutReady(() => void this.index?.scanAll());

		// Falah announces a fresh api whenever it finishes loading — including a
		// disable/re-enable, which produces a NEW api object with empty registries
		// that our previously-registered hooks are no longer wired to. This is
		// Falah's FALAH_API_READY_EVENT ("falah:api-ready" in src/api.ts); Tadabbur
		// imports no Falah source, so the event name is hardcoded here.
		this.registerEvent(
			this.app.workspace.on("falah:api-ready" as never, ((api: FalahApi) => this.attach(api)) as never)
		);

		this.addSettingTab(new TadabburSettingTab(this.app, this));
		this.addCommand({
			id: "create-reflections-base",
			name: t().cmdCreateReflectionsBase,
			callback: () => void createReflectionsBase(this.app),
		});

		// Falah may load after us; resolve now, else retry once the layout is ready.
		const falah = resolveFalah(this.app);
		if (falah) {
			this.attach(falah);
			return;
		}
		this.app.workspace.onLayoutReady(() => {
			if (this.index) return; // already attached via falah:api-ready in the meantime
			const late = resolveFalah(this.app);
			if (late) {
				this.attach(late);
				return;
			}
			// The constructor already proved Falah is enabled, so this isn't "not
			// installed" — Falah is present but published no compatible api. In
			// practice that means it's too old for us.
			logMessage(t().noticeNeedsFalahApi(REQUIRED_FALAH_API), "error", { durationMs: 15000 });
		});
	}

	/** Undo everything attach() wired up against a specific Falah api instance.
	 *  Idempotent — safe to call even if never attached (e.g. plugin unload before
	 *  Falah ever showed up). Does NOT touch this.index itself: the reflection
	 *  index is rebuilt in place on re-attach, not torn down. */
	private detach(): void {
		this.offVerseAction?.();
		this.offDecorator?.();
		this.offIndexChange?.();
		this.offVerseAction = undefined;
		this.offDecorator = undefined;
		this.offIndexChange = undefined;
		setFalah(undefined);
	}

	/** (Re-)wire Tadabbur against a live Falah api. Runs on first boot and again
	 *  every time Falah announces a fresh api via falah:api-ready — e.g. after a
	 *  disable/re-enable, whose new instance has empty registries that any
	 *  previous registerVerseAction/registerAyahRowDecorator calls no longer
	 *  reach. detach() first so re-attach is idempotent (no double-registration). */
	private attach(falah: FalahApi): void {
		this.detach();
		setFalah(falah);

		if (!this.index) {
			this.index = new ReflectionIndexService(this.app);
			this.register(() => this.index?.dispose());
		}
		const index = this.index;
		index.scheduleRescan(); // don't rebuild the index, but do refresh it now

		this.offVerseAction = falah.registerVerseAction(reflectVerseAction(this.app, () => this.settings));
		this.offDecorator = falah.registerAyahRowDecorator((row, ctx: VerseContext) =>
			renderReflectionStrip(index, this.app, row, ctx.ayahKey)
		);
		// Falah can't re-run our row decorator on its own — ask it to refresh the
		// open reader's rows whenever the index changes so the per-ayah reflection
		// strip stays live (no waiting for the user to change surah).
		this.offIndexChange = index.onChange(() => falah.refreshReader());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
