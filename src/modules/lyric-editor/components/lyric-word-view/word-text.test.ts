import { describe, expect, it, vi } from "vitest";
import { getDisplayWordText, isWordBlankText } from "./word-text";

describe("isWordBlankText", () => {
	it.each(["", " ", "  ", "\t\n", "\u3000"])("recognizes %j as blank", (word) =>
		expect(isWordBlankText(word)).toBe(true));

	it.each([
		"word",
		" word ",
		"漢字",
		"\u200b",
	])("recognizes %j as nonblank", (word) =>
		expect(isWordBlankText(word)).toBe(false));
});

describe("getDisplayWordText", () => {
	const translate = () =>
		vi.fn((key: string, _fallback: string, options?: { count?: number }) =>
			options ? `${key}:${options.count}` : key,
		);

	it("keeps original text when romanization is disabled", () => {
		const t = translate();
		expect(getDisplayWordText(t, "漢字", false, "kanji", false)).toBe("漢字");
		expect(t).not.toHaveBeenCalled();
	});

	it("shows nonblank romanization verbatim before blank-word labels", () => {
		const t = translate();
		expect(getDisplayWordText(t, "", true, " kanji ", true)).toBe(" kanji ");
		expect(t).not.toHaveBeenCalled();
	});

	it.each([
		undefined,
		"",
		" \t",
	])("falls back to the word for blank romanization %j", (romanWord) => {
		expect(
			getDisplayWordText(translate(), "漢字", false, romanWord, true),
		).toBe("漢字");
	});

	it("uses the existing empty label for an empty word", () => {
		const t = translate();
		expect(getDisplayWordText(t, "", true)).toBe("lyricWordView.empty");
		expect(t).toHaveBeenCalledWith("lyricWordView.empty", "空白");
	});

	it("passes the original character count for whitespace labels", () => {
		const t = translate();
		expect(getDisplayWordText(t, " \t ", true)).toBe(
			"lyricWordView.spaceCount:3",
		);
		expect(t).toHaveBeenCalledWith(
			"lyricWordView.spaceCount",
			"空格 x{count}",
			{
				count: 3,
			},
		);
	});
});
