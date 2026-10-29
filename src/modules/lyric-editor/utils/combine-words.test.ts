import { describe, expect, it } from "vitest";
import { type LyricWord, newLyricWord } from "$/types/ttml";
import {
	combineMatchingWordSequences,
	combineSelectedWords,
	getCombinationRule,
	getCombineWordSelection,
} from "./combine-words";

const word = (text: string, startTime: number, endTime: number): LyricWord => ({
	...newLyricWord(),
	word: text,
	startTime,
	endTime,
});

describe("combine words", () => {
	it("remembers only combinations belonging to one known lexical group", () => {
		const parts = [word("peo", 0, 1), word("ple", 1, 2)];
		expect(getCombinationRule(parts)).toBeNull();
		for (const part of parts) part.splitGroupId = "people";
		expect(getCombinationRule(parts)).toEqual({
			key: "people",
			boundaries: [],
		});
		parts[1].word = " ple";
		expect(getCombinationRule(parts)).toBeNull();
	});
	it("combines an adjacent selection with the existing timing behavior", () => {
		const words = [word("beau", 100, 200), word("tiful", 200, 400)];
		const selectedIds = new Set(words.map(({ id }) => id));

		const result = combineSelectedWords(words, selectedIds);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			word: "beautiful",
			startTime: 100,
			endTime: 400,
		});
	});

	it("preserves source order for non-adjacent selections", () => {
		const words = [
			word("one", 0, 100),
			word("middle", 100, 200),
			word("two", 200, 300),
		];
		const selectedIds = new Set([words[0].id, words[2].id]);

		expect(getCombineWordSelection(words, selectedIds)?.isContiguous).toBe(
			false,
		);
		expect(
			combineSelectedWords(words, selectedIds).map(({ word }) => word),
		).toEqual(["one", "middle", "two"]);
	});

	it("retains the first ID, romanization and review flags", () => {
		const words = [
			{ ...word("beau", 0, 50), romanWord: "beau", romanWarning: true },
			{ ...word("tiful", 50, 100), romanWord: "tiful", obscene: true },
		];
		const result = combineSelectedWords(
			words,
			new Set(words.map((item) => item.id)),
		);
		expect(result[0]).toMatchObject({
			id: words[0].id,
			romanWord: "beautiful",
			romanWarning: true,
			obscene: true,
		});
	});

	it("combines every exact consecutive sequence", () => {
		const target = [word("some", 0, 1), word("thing", 1, 2)];
		const words = [
			word("some", 10, 20),
			word("thing", 20, 40),
			word("else", 40, 50),
			word("some", 50, 60),
			word("thing", 60, 80),
		];

		const result = combineMatchingWordSequences(words, target, false);

		expect(result.map(({ word }) => word)).toEqual([
			"something",
			"else",
			"something",
		]);
		expect(result[0]).toMatchObject({ startTime: 10, endTime: 40 });
		expect(result[2]).toMatchObject({ startTime: 50, endTime: 80 });
	});

	it("uses Split Word normalization and preserves each occurrence's text", () => {
		const target = [word("“BEAU", 0, 1), word("TIFUL?”", 1, 2)];
		const words = [word("beau", 10, 20), word("tiful", 20, 30)];

		expect(combineMatchingWordSequences(words, target, false)).toBe(words);
		expect(
			combineMatchingWordSequences(words, target, true).map(({ word }) => word),
		).toEqual(["beautiful"]);
	});

	it("requires punctuation-only tokens to match exactly", () => {
		const target = [word("hello", 0, 1), word("!", 1, 2)];
		const words = [word("HELLO", 10, 20), word("?", 20, 30)];

		expect(combineMatchingWordSequences(words, target, true)).toBe(words);
	});

	it("combines overlapping candidates left-to-right without overlap", () => {
		const target = [word("ha", 0, 1), word("ha", 1, 2)];
		const words = [word("ha", 0, 1), word("ha", 1, 2), word("ha", 2, 3)];

		expect(
			combineMatchingWordSequences(words, target, false).map(
				({ word }) => word,
			),
		).toEqual(["haha", "ha"]);
	});
});
