import { describe, expect, it } from "vitest";
import { filterFonts, getImportedFontName } from "./fontHelpers";

describe("font library filtering", () => {
	const fonts = ["Inter", "Roboto", "Inter Tight", "Inter"];

	it("matches case-insensitive substrings and preserves catalog order and duplicates", () => {
		expect(filterFonts(fonts, "INTER")).toEqual([
			"Inter",
			"Inter Tight",
			"Inter",
		]);
		expect(filterFonts(fonts, "bot")).toEqual(["Roboto"]);
	});

	it("returns a fresh full list for an empty query without changing the catalog", () => {
		const result = filterFonts(fonts, "");
		expect(result).toEqual(fonts);
		expect(result).not.toBe(fonts);
		expect(fonts).toEqual(["Inter", "Roboto", "Inter Tight", "Inter"]);
	});

	it("preserves whitespace in the query", () => {
		expect(filterFonts(fonts, " Inter ")).toEqual([]);
	});
});

describe("imported font family names", () => {
	it.each([
		["My Font-Regular.woff2", "MyFontRegular"],
		["Family.variant.ttf", "Family"],
		["Café_123.otf", "Caf123"],
		[".hidden.ttf", ""],
		["Font42", "Font42"],
	])("keeps the existing sanitization for %s", (file, expected) => {
		expect(getImportedFontName(file)).toBe(expected);
	});
});
