// The reflect verse action — registered via Falah's registerVerseAction to
// prove the seam. onClick delegates to openReflect, which owns the modal
// (obsidian) in capture.ts.

import type { App } from "obsidian";
import type { VerseAction } from "../falah-api";
import type { TadabburSettings } from "../settings";
import { openReflect } from "./capture";
import { t } from "../i18n";

export function reflectVerseAction(app: App, getSettings: () => TadabburSettings): VerseAction {
	return {
		id: "reflect",
		items(ctx) {
			return [
				{
					title: t().actionReflectOnThisVerse,
					section: "falah-reflect",
					icon: "feather",
					onClick: () =>
						openReflect(
							app,
							{ surah: ctx.surah, ayah: ctx.ayah, arabic: ctx.arabic, translation: ctx.translation },
							getSettings()
						),
				},
			];
		},
	};
}
