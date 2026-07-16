import { Notice, Plugin } from 'obsidian';
import { resolveFalah, setFalah, REQUIRED_FALAH_API } from './falah-runtime';
import type { FalahApi } from './falah-api';

export default class TadabburPlugin extends Plugin {
	async onload(): Promise<void> {
		// Falah may load after us; resolve now, else retry once the layout is ready.
		const falah = resolveFalah(this.app);
		if (falah) return this.activate(falah);
		this.app.workspace.onLayoutReady(() => {
			const late = resolveFalah(this.app);
			if (late) void this.activate(late);
			else new Notice(`Tadabbur requires the Falah plugin (API ≥ ${REQUIRED_FALAH_API}). Install/enable Falah and reload.`);
		});
	}

	private activate(_falah: FalahApi): void {
		setFalah(_falah);
		// Task 9 wires: index service, register verse action + row decorator,
		// settings tab, and the "create reflections base" command here.
	}
}
