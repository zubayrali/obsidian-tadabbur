// Static, offline reflection scaffolds. Pure data + a formatter — no AI in MVP.
// Presets are data so settings can add/edit them later.
//
// `name` and `fields` are getters, not plain string properties: they're
// user-facing (dropdown labels, note headings) and must resolve through t(),
// but t() can't be called at module-load time — Obsidian's locale isn't ready
// yet then, and t() caches its first result forever. A getter only runs when
// actually read (i.e. at render time), so PROMPT_SCAFFOLDS stays a plain
// module-level array while the strings stay locale-correct.
import { t } from "../i18n";

export interface PromptScaffold {
	id: string;
	name: string;
	fields: string[];
}

export const PROMPT_SCAFFOLDS: PromptScaffold[] = [
	{
		id: "three-line",
		get name(): string {
			return t().scaffoldNameThreeLine;
		},
		get fields(): string[] {
			return [t().fieldSummary, t().fieldMeansToMe, t().fieldOneAction];
		},
	},
	{
		id: "three-lens",
		get name(): string {
			return t().scaffoldNameThreeLens;
		},
		get fields(): string[] {
			return [t().fieldSelfExamination, t().fieldGratitudeOrAction, t().fieldDua];
		},
	},
];

export function scaffoldById(id: string): PromptScaffold {
	return PROMPT_SCAFFOLDS.find((s) => s.id === id) ?? PROMPT_SCAFFOLDS[0]!;
}

export function formatScaffold(s: PromptScaffold): string {
	return s.fields.map((f) => `**${f}.** `).join("\n\n");
}
