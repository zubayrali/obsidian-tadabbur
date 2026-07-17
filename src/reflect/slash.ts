// The /reflect slash item — registered via Falah's registerSlashItem. Composes
// Falah's own verse picker with our reflect modal, then writes at the cursor.

import type { App, Editor, TFile } from "obsidian";
import type { SlashItem } from "../falah-api";
import type { TadabburSettings } from "../settings";
import { getFalah } from "../falah-runtime";
import { openReflect } from "./capture";
import { logMessage } from "../log";
import { t } from "../i18n";

export function reflectSlashItem(app: App, getSettings: () => TadabburSettings): SlashItem {
	return {
		id: "reflect",
		get label() {
			// A getter, not a captured value: resolving at render time avoids freezing
			// the string before Obsidian's locale is ready.
			return t().slashReflectLabel;
		},
		keywords: "reflect tadabbur journal reflection ayah verse",
		onSelect: async (editor: Editor, file: TFile | null) => {
			try {
				const falah = getFalah();
				const ref = await falah.pickVerse();
				if (!ref) return; // dismissed without choosing
				const text = await falah.getVerseText(ref.surah, ref.ayah);
				if (!text) {
					// No verse text means no data installed or no connection. Better to
					// stop here than save a reflection with an empty verse body.
					logMessage(t().noticeNoVerseText(ref.surah, ref.ayah), "error");
					return;
				}
				openReflect(
					app,
					{ surah: ref.surah, ayah: ref.ayah, arabic: text.arabic, translation: text.translation },
					getSettings(),
					{ kind: "cursor", editor, file }
				);
			} catch (e) {
				// pickVerse()/getVerseText() can genuinely reject (e.g. the user's
				// picker flow errors, or data lookup fails) while this handler is
				// mid-await. A throw here must not escape into Obsidian's
				// editor-suggest handler, so abort quietly and log instead.
				//
				// Note: disabling Falah mid-await does NOT make getFalah() throw —
				// Falah has no onunload and never clears its api, and Tadabbur's
				// `current` singleton is only cleared by falah-runtime's detach().
				// getFalah() would instead return a stale api; harmless today only
				// because everything reached through it (FALAH_REF) is pure
				// module-level functions.
				logMessage(e instanceof Error ? e.message : String(e), "error");
			}
		},
	};
}
