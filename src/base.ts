import { Notice, type App } from "obsidian";

export const REFLECTIONS_BASE = `filters:
  and:
    - file.hasTag("tadabbur")
    - 'file.ext == "md"'
formulas:
  day: 'if(date(file.basename), date(file.basename).format("dddd"), "")'
  verse_count: 'if(verses, verses.length, 0)'
properties:
  file.name:
    displayName: "Date"
  formula.day:
    displayName: "Day"
  verses:
    displayName: "Verses"
  themes:
    displayName: "Themes"
  formula.verse_count:
    displayName: "Verses #"
views:
  - type: table
    name: "Timeline"
    order:
      - file.name
      - formula.day
      - verses
      - themes
      - formula.verse_count
    sort:
      - property: file.name
        direction: DESC
    summaries:
      formula.verse_count: Sum
  - type: table
    name: "By theme"
    groupBy:
      property: themes
      direction: ASC
    order:
      - file.name
      - verses
      - themes
  - type: cards
    name: "Cards"
    order:
      - file.name
      - verses
      - themes
`;

export async function createReflectionsBase(app: App): Promise<void> {
	const path = "Reflections.base";
	if (app.vault.getAbstractFileByPath(path)) {
		new Notice("Reflections.base already exists");
		return;
	}
	await app.vault.create(path, REFLECTIONS_BASE);
	new Notice("Created Reflections.base");
}
