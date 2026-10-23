import { describe, expect, it } from "vitest";
import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml";
import type { SegmentationConfig } from "../types";
import { segmentSelectedWords } from "./segmentation";

const config: SegmentationConfig = {
	engine: "basic",
	splitCJK: true,
	splitEnglish: true,
	punctuationWeight: 0.2,
	punctuationMode: "merge",
	removeEmptySegments: true,
	ignoreList: new Set(),
	customRules: new Map(),
	learnedRules: new Map([["hello", [3]]]),
};

const word = (text: string, start: number, end: number) => ({
	...newLyricWord(),
	word: text,
	startTime: start,
	endTime: end,
});

const line = (...words: ReturnType<typeof word>[]): LyricLine => ({
	...newLyricLine(),
	words,
});

describe("segmentSelectedWords", () => {
	it("splits only the selected word and keeps its time span", () => {
		const target = word("hello", 1000, 2000);
		const other = word("hello", 2000, 3000);
		const lines = [line(target, other)];

		const count = segmentSelectedWords(lines, new Set([target.id]), config);

		expect(count).toBe(1);
		expect(lines[0].words.map((w) => w.word)).toEqual(["hel", "lo", "hello"]);
		expect(lines[0].words[0].startTime).toBe(1000);
		expect(lines[0].words[1].endTime).toBe(2000);
		expect(lines[0].words[2]).toBe(other);
	});

	it("leaves lines without selected words untouched", () => {
		const untouched = line(word("hello", 0, 500));
		const before = untouched.words;
		const lines = [untouched];

		expect(segmentSelectedWords(lines, new Set(["missing"]), config)).toBe(0);
		expect(lines[0].words).toBe(before);
	});
});
