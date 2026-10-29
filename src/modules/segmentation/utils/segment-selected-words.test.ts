import { describe, expect, it, vi } from "vitest";
import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml";
import type { SegmentationConfig } from "../types";
import {
	recalculateWordTime,
	segmentLyricLines,
	segmentSelectedWords,
} from "./segmentation";

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
	it("preserves generated and manually corrected syllables on repeated runs", () => {
		const source = [line(word("people", 100, 1100))];
		const options = { ...config, engine: "prosodic" as const };
		const first = segmentLyricLines(source, options);
		expect(first[0].words.map((part) => part.word)).toEqual(["peo", "ple"]);
		expect(segmentLyricLines(first, options)).toEqual(first);
		const manual = recalculateWordTime(
			source[0].words[0],
			["pe", "ople"],
			options,
		);
		expect(segmentLyricLines([line(...manual)], options)[0].words).toEqual(
			manual,
		);
	});

	it("keeps selection IDs and recoverable romanization when splitting", () => {
		const target = {
			...word("hello", 0, 1000),
			romanWord: "reading",
			romanWarning: true,
		};
		const lines = [line(target)];
		segmentSelectedWords(lines, new Set([target.id]), config);
		expect(lines[0].words[0].id).toBe(target.id);
		expect(lines[0].words.map((part) => part.romanWord).join("")).toBe(
			"reading",
		);
		expect(lines[0].words.every((part) => part.romanWarning)).toBe(true);
	});
	it("prepares protected rules once per batch and refreshes mutated rules for the next batch", () => {
		const rules = new Map([["hello", ["he", "llo"]]]);
		const readKeys = vi.spyOn(rules, "keys");
		const options = {
			...config,
			customRules: rules,
			learnedRules: new Map(),
			ignoreList: new Set(["world"]),
		};
		const source = [
			line(word("hello world", 0, 1000), word("hello", 1000, 2000)),
		];
		expect(
			segmentLyricLines(source, options)[0].words.map((part) => part.word),
		).toEqual(["he", "llo", " ", "world", "he", "llo"]);
		expect(readKeys).toHaveBeenCalledOnce();
		rules.set("hello", ["hel", "lo"]);
		expect(
			segmentLyricLines(source, options)[0].words.map((part) => part.word),
		).toEqual(["hel", "lo", " ", "world", "hel", "lo"]);
		expect(readKeys).toHaveBeenCalledTimes(2);
	});

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
