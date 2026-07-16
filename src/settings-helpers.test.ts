import { describe, expect, it } from "vitest";
import { cleanHeading, cleanFolder } from "./settings-helpers";

describe("cleanHeading", () => {
	it("passes plain heading text through with no note", () => {
		expect(cleanHeading("Tadabbur")).toEqual({ value: "Tadabbur" });
		expect(cleanHeading("  Reflections  ")).toEqual({ value: "Reflections" });
	});
	it("strips Markdown hashes and explains why", () => {
		// The trap: the setting wants heading TEXT. "## Tadabbur" would otherwise
		// make spliceUnderHeading hunt for a heading whose text is "## Tadabbur",
		// never match, and create `## ## Tadabbur`.
		const r = cleanHeading("## Tadabbur");
		expect(r.value).toBe("Tadabbur");
		expect(r.note).toBeTruthy();
		expect(cleanHeading("### Deep").value).toBe("Deep");
		expect(cleanHeading("#NoSpace").value).toBe("NoSpace");
	});
	it("falls back to the default when empty or only hashes", () => {
		expect(cleanHeading("").value).toBe("Tadabbur");
		expect(cleanHeading("   ").value).toBe("Tadabbur");
		expect(cleanHeading("##").value).toBe("Tadabbur");
		expect(cleanHeading("").note).toBeTruthy();
	});
});

describe("cleanFolder", () => {
	it("passes a plain folder through with no note", () => {
		expect(cleanFolder("Tadabbur")).toEqual({ value: "Tadabbur" });
		expect(cleanFolder("Islam/Reflections").value).toBe("Islam/Reflections");
	});
	it("trims stray and duplicated slashes", () => {
		expect(cleanFolder("/Tadabbur/").value).toBe("Tadabbur");
		expect(cleanFolder("//Notes//").value).toBe("Notes");
		expect(cleanFolder("Islam//Reflections").value).toBe("Islam/Reflections");
	});
	it("drops a .md someone typed, since this is a folder", () => {
		const r = cleanFolder("Tadabbur.md");
		expect(r.value).toBe("Tadabbur");
		expect(r.note).toBeTruthy();
		expect(cleanFolder("Islam/Notes.MD").value).toBe("Islam/Notes");
	});
	it("falls back to the default when empty", () => {
		expect(cleanFolder("").value).toBe("Tadabbur");
		expect(cleanFolder("  /  ").value).toBe("Tadabbur");
		expect(cleanFolder(".md").value).toBe("Tadabbur");
		expect(cleanFolder("").note).toBeTruthy();
	});
});
