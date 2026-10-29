import { describe, expect, it } from "vitest";
import type { LyricLine } from "$/types/ttml";
import {
	detectSyllabificationEngine,
	matchesSavedSyllabificationEngine,
} from "./detect-syllabification-engine";

const lyrics = (text: string) =>
	[
		{
			words: text.split(/(?<=\s)/).map((word) => ({ word })),
		},
	] as LyricLine[];

describe("detectSyllabificationEngine", () => {
	it("uses script detection for Japanese, Cyrillic, and Han lyrics", () => {
		expect(detectSyllabificationEngine(lyrics("これは日本語の歌詞です"))).toBe(
			"japanese",
		);
		expect(
			detectSyllabificationEngine(
				lyrics(
					"Это русский текст песни с достаточно большим количеством слов для определения языка.",
				),
			),
		).toBe("syllabify");
		expect(detectSyllabificationEngine(lyrics("這是一首中文歌曲"))).toBe(
			"basic",
		);
	});

	it("uses language identification for sufficiently long Latin lyrics", () => {
		expect(
			detectSyllabificationEngine(
				lyrics(
					"This is a simple English lyric with enough text to detect its language.",
				),
			),
		).toBe("prosodic");
		expect(
			detectSyllabificationEngine(
				lyrics(
					"To jest prosty polski tekst piosenki zawierający wystarczająco dużo słów do rozpoznania języka.",
				),
			),
		).toBe("hyphenation-pl");
	});

	it("does not guess when there are no lyrics", () => {
		expect(detectSyllabificationEngine([])).toBeUndefined();
		expect(
			detectSyllabificationEngine(lyrics("это русские слова песни")),
		).toBeUndefined();
	});

	it("only auto-applies when the suggestion matches the saved engine", () => {
		const japaneseLyrics = lyrics("これは日本語の歌詞です");

		expect(matchesSavedSyllabificationEngine(japaneseLyrics, "japanese")).toBe(
			true,
		);
		expect(matchesSavedSyllabificationEngine(japaneseLyrics, "prosodic")).toBe(
			false,
		);
		expect(matchesSavedSyllabificationEngine([], "prosodic")).toBe(true);
	});

	it("uses declared language and ignores isolated script outliers", () => {
		const text =
			"This is a simple English lyric with enough text to detect its language.";
		for (const outlier of ["あ", "Я", "你"])
			expect(detectSyllabificationEngine(lyrics(`${text} ${outlier}`))).toBe(
				"prosodic",
			);
		const declared = lyrics("hello");
		declared[0].language = "pl-PL";
		expect(detectSyllabificationEngine(declared)).toBe("hyphenation-pl");
		declared[0].language = "uk";
		expect(detectSyllabificationEngine(declared)).toBe("basic");
		expect(detectSyllabificationEngine(lyrics("한국어 노래 가사입니다"))).toBe(
			"basic",
		);
	});
});
