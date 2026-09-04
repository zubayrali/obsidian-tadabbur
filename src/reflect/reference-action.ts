import type { App } from "obsidian";
import type { ReferenceAction } from "../falah-api";
import type { TadabburSettings } from "../settings";
import { getFalah } from "../falah-runtime";
import { logMessage } from "../log";
import { t } from "../i18n";
import { openReflect } from "./capture";

/** Exposes reflection capture from rendered Quran references and detail views. */
export function reflectReferenceAction(app: App, getSettings: () => TadabburSettings): ReferenceAction {
	return {
		id: "reflect",
		items(ref) {
			if (ref.kind !== "quran") return [];
			return [{
				title: t().actionReflectOnThisVerse,
				section: "falah-reflect",
				icon: "feather",
				onClick: async () => {
					const text = await getFalah().getVerseText(ref.surah, ref.ayah);
					if (!text) {
						logMessage(t().noticeNoVerseText(ref.surah, ref.ayah), "error");
						return;
					}
					openReflect(
						app,
						{ surah: ref.surah, ayah: ref.ayah, arabic: text.arabic, translation: text.translation },
						getSettings(),
					);
				},
			}];
		},
	};
}
