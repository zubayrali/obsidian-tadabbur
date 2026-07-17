import type { Strings } from "./en";

/** Partial on purpose: any key omitted here falls back to English at merge
 *  time, so a half-finished translation is a first-class state. Only short,
 *  unambiguous UI labels are translated — see the task brief for the bar. */
export const ar: Partial<Strings> = {
    pluginName: "تدبر",
    setHeadingReflections: "تدبرات",
    stripReflectionsLabel: "تدبرات",
    stripMentionsLabel: "إشارات",
    stripConnectedLabel: "متصل:",
    fieldSummary: "ملخص",
    fieldDua: "دعاء",
};
