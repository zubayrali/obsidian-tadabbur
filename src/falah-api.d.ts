// Ambient mirror of Falah's public API + the types it exposes. Hand-maintained;
// update alongside Falah's FALAH_API_VERSION. Tadabbur imports NO Falah source.
export interface QuranRef { kind: "quran"; surah: number; ayah: number; toAyah?: number; fromWord?: number; toWord?: number }
export interface HadithRef { kind: "hadith"; collection: string; number: string }
export type IslamicReference = QuranRef | HadithRef;
export interface RenderedText { arabic?: string; translation?: string; attribution?: string }
export interface FoundReference { index: number; match: string; label: string; uri: string; ref: IslamicReference }

export interface VerseView {
	isVerseTafsirShown(ayahKey: string, tafsirId: string): boolean;
	toggleVerseTafsir(ayahKey: string, tafsirId: string): void | Promise<void>;
}
export interface VerseContext {
	surah: number; ayah: number; ayahKey: string;
	arabic: string; translation?: string;
	plugin: unknown; view: VerseView;
}
export interface VerseMenuItem {
	title: string; icon?: string; section?: string; checked?: boolean;
	submenu?: VerseMenuItem[]; onClick?: () => void | Promise<void>;
}
export interface VerseAction {
	id: string;
	items(ctx: VerseContext): VerseMenuItem[] | Promise<VerseMenuItem[]>;
}

export type AyahRowDecorator = (row: HTMLElement, ctx: VerseContext) => void;
export interface VerseText { arabic: string; translation?: string }
export interface FalahRefApi {
	toUri(ref: IslamicReference): string;
	toCallout(ref: IslamicReference, text?: RenderedText): string;
	parseRefUri(uri: string): IslamicReference | null;
	findReferences(text: string): FoundReference[];
	parseAyahKey(key: string): { surah: number; ayah: number } | null;
}
export interface FalahApi {
	readonly version: number;
	registerVerseAction(action: VerseAction): () => void;
	registerAyahRowDecorator(decorator: AyahRowDecorator): () => void;
	getVerseText(surah: number, ayah: number): Promise<VerseText | undefined>;
	navigateReaderTo(surah: number, ayah: number): void;
	ref: FalahRefApi;
}
