import { describe, expect, it } from "vitest";
import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml";
import { deleteWordsFromLines, normalizeLineTime } from "./normalize-line-time";

const word = (text: string, start: number, end: number) => ({
	...newLyricWord(),
	word: text,
	startTime: start,
	endTime: end,
});

const line = (
	start: number,
	end: number,
	...words: ReturnType<typeof word>[]
): LyricLine => ({ ...newLyricLine(), startTime: start, endTime: end, words });

describe("normalizeLineTime", () => {
	it("skips a trailing untimed space when finding the line end", () => {
		const l = line(0, 3000, word("one", 1000, 2000), word(" ", 0, 0));
		normalizeLineTime(l);
		expect([l.startTime, l.endTime]).toEqual([1000, 2000]);
	});

	it("keeps a word that starts at 0 ms as the line start", () => {
		const l = line(500, 2000, word("go", 0, 300), word("now", 300, 900));
		normalizeLineTime(l);
		expect([l.startTime, l.endTime]).toEqual([0, 900]);
	});

	it("leaves a line with no timed words alone", () => {
		const l = line(100, 200, word("a", 0, 0));
		normalizeLineTime(l);
		expect([l.startTime, l.endTime]).toEqual([100, 200]);
	});
});

describe("deleteWordsFromLines", () => {
	// R55: deleting trailing words left the line end where it was.
	it("pulls the line end back after deleting trailing words", () => {
		const keep = word("keep", 1000, 1500);
		const gone = word("gone", 1500, 2500);
		const l = line(1000, 2500, keep, word(" ", 0, 0), gone);

		deleteWordsFromLines([l], new Set([gone.id]));

		expect(l.words.map((w) => w.word)).toEqual(["keep", " "]);
		expect(l.endTime).toBe(1500);
	});

	// R42: duplicating a line and trimming each copy left both spanning the
	// original time, so both lit up as current.
	it("gives each trimmed duplicate its own bounds", () => {
		const a1 = word("first", 1000, 2000);
		const b1 = word("second", 2000, 3000);
		const a2 = word("first", 1000, 2000);
		const b2 = word("second", 2000, 3000);
		const original = line(1000, 3000, a1, b1);
		const copy = line(1000, 3000, a2, b2);

		deleteWordsFromLines([original, copy], new Set([b1.id, a2.id]));

		expect([original.startTime, original.endTime]).toEqual([1000, 2000]);
		expect([copy.startTime, copy.endTime]).toEqual([2000, 3000]);
	});

	it("doesn't touch lines that lost no words", () => {
		const l = line(0, 9999, word("a", 100, 200));
		deleteWordsFromLines([l], new Set(["other"]));
		expect(l.endTime).toBe(9999);
	});
});
