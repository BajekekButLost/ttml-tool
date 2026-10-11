import { describe, expect, it } from "vitest";
import { parseRubyShortcut } from "./ruby-shortcut";

describe("parseRubyShortcut", () => {
	it.each([
		"",
		"word",
		"word|tail",
		"word| ",
		" word ",
	])("preserves %j when it has no trailing pipe", (value) => {
		expect(parseRubyShortcut(value)).toEqual({
			word: value,
			enableRuby: false,
		});
	});

	it.each([
		["|", ""],
		["word|", "word"],
		["word||", "word|"],
		[" 漢字 |", " 漢字 "],
	])("removes only the last pipe in %j and enables ruby", (value, word) => {
		expect(parseRubyShortcut(value)).toEqual({ word, enableRuby: true });
	});
});
