// Static, offline reflection scaffolds. Pure data + a formatter — no AI in MVP.
// Presets are data so settings can add/edit them later.

export interface PromptScaffold {
	id: string;
	name: string;
	fields: string[];
}

export const PROMPT_SCAFFOLDS: PromptScaffold[] = [
	{
		id: "three-line",
		name: "3-line (Summary / Meaning / Action)",
		fields: ["Summary", "What it means to me", "One action"],
	},
	{
		id: "three-lens",
		name: "3-lens (Self / Gratitude / Du'ā)",
		fields: ["Self-examination", "Gratitude or action", "Du'ā"],
	},
];

export function scaffoldById(id: string): PromptScaffold {
	return PROMPT_SCAFFOLDS.find((s) => s.id === id) ?? PROMPT_SCAFFOLDS[0]!;
}

export function formatScaffold(s: PromptScaffold): string {
	return s.fields.map((f) => `**${f}.** `).join("\n\n");
}
