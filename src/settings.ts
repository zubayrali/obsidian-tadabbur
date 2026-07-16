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
