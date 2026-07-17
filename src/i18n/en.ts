// Every user-facing string in Tadabbur. This is the source of truth: other locales
// are Partial<Strings>, so any key they omit falls back to English at merge time.
//
// Interpolation is a function per key, never concatenation at the call site —
// word order differs in RTL (Arabic) and in Urdu, and a call site that glues
// fragments together cannot be translated correctly.
export const en = {
	pluginName: "Tadabbur",

	// -- Main: Falah dependency / commands --
	noticeNoFalah: (url: string) =>
		"Tadabbur requires the Falah plugin — it reads the Quran text and reader from it, and does nothing on its own. " +
		`Install and enable Falah first, then enable Tadabbur.\n\n${url}`,
	cmdCreateReflectionsBase: "Create reflections base",
	noticeNeedsFalahApi: (version: number) =>
		`Tadabbur needs Falah's plugin API v${version} or newer. Falah is enabled but didn't provide it — update Falah, then reload.`,

	// -- Settings: reflections section --
	setHeadingReflections: "Reflections",
	setDestinationName: "Save reflections to",
	setDestinationDesc: "Where a reflection is written. “Ask each time” prompts in the capture dialog.",
	optionDestinationAsk: "Ask each time",
	optionDestinationPerAyah: "Per-ayah note",
	optionDestinationDaily: "Today's daily note",
	setDefaultScaffoldName: "Default reflection scaffold",
	setDefaultScaffoldDesc: "The structure the capture box starts with. You can change it per reflection.",
	setPerAyahFolderName: "Per-ayah reflection folder",
	settingsExampleFolder: (path: string) => `Example: ${path}`,
	setDailyNoteHeadingName: "Daily-note heading",
	settingsAppendedUnder: (heading: string, path: string) => `Appended under “## ${heading}” in ${path}`,
	settingsSeededFromTemplate: (template: string) => `New days are seeded from your template: ${template}`,
	settingsDailyNotesOffWarning:
		"Core Daily Notes is off, so there's no folder or format to follow — reflections would land at the vault root. Enable Daily Notes to control this.",

	// -- Reflect scaffolds (src/reflect/prompts.ts) --
	scaffoldNameThreeLine: "3-line (Summary / Meaning / Action)",
	scaffoldNameThreeLens: "3-lens (Self / Gratitude / Du'ā)",
	fieldSummary: "Summary",
	fieldMeansToMe: "What it means to me",
	fieldOneAction: "One action",
	fieldSelfExamination: "Self-examination",
	fieldGratitudeOrAction: "Gratitude or action",
	fieldDua: "Du'ā",

	// -- Reflect capture modal --
	captureHeading: (surah: number, ayah: number) => `Reflect on ${surah}:${ayah}`,
	setScaffoldName: "Scaffold",
	setThemesName: "Themes",
	setThemesDesc: "Comma-separated, optional",
	placeholderThemes: "tawhid, tawakkul",
	setSaveToName: "Save to",
	optionSaveToPerAyah: "Per-ayah note",
	optionSaveToDaily: "Today's daily note",
	buttonSaveReflection: "Save reflection",
	noticeReflectionSaved: "Reflection saved",
	noticeSaveReflectionFailed: (reason: string) => `Could not save reflection: ${reason}`,

	// -- Reflect verse action --
	actionReflectOnThisVerse: "Reflect on this verse",

	// -- Reflect slash item (src/reflect/slash.ts) --
	slashReflectLabel: "Reflect on a verse",
	noticeNoVerseText: (surah: number, ayah: number) =>
		`Couldn't load ${surah}:${ayah}. Install Quran data or check your connection.`,

	// -- Reflection strip --
	stripGroupLabel: (label: string, count: number) => `${label} (${count})`,
	stripReflectionsLabel: "Reflections",
	stripMentionsLabel: "Mentions",
	stripConnectedLabel: "Connected:",

	// -- Reflections base --
	noticeBaseAlreadyExists: "Reflections.base already exists",
	noticeBaseCreated: "Created Reflections.base",

	// -- Settings helpers (pure, no obsidian import) --
	noteHeadingEmpty: (def: string) => `Can't be empty — using “${def}”.`,
	noteHeadingStripped: (value: string) => `Just the text, no “#” — using “${value}”.`,
	noteFolderEmpty: (def: string) => `Can't be empty — using “${def}”.`,
	noteFolderDroppedMd: "That's a folder, not a note — dropped the “.md”.",
};

export type Strings = typeof en;
