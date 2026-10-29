import { describe, expect, it } from "vitest";
import { newLyricWord } from "$/types/ttml";
import { graphemes, preservesSource } from "$/utils/graphemes";
import type { SegmentationConfig } from "../types";
import { recalculateWordTime, segmentWord } from "./segmentation";

const config: SegmentationConfig = {
	engine: "basic",
	splitCJK: true,
	splitEnglish: true,
	punctuationWeight: 0.2,
	punctuationMode: "merge",
	removeEmptySegments: true,
	ignoreList: new Set(),
	customRules: new Map(),
	learnedRules: new Map(),
};

const split = (word: string) =>
	segmentWord({ ...newLyricWord(), word }, config).map((part) => part.word);

describe("auto segment keeps quotes and closing marks on their word", () => {
	it("reports rejected output and insufficient draft timing", () => {
		const diagnostics: string[] = [];
		const settings = {
			...config,
			onDiagnostic: (reason: string) => {
				diagnostics.push(reason);
			},
		};
		segmentWord(
			{ ...newLyricWord(), word: "éé" },
			{ ...settings, engine: "syllabify-fr" },
		);
		segmentWord(
			{ ...newLyricWord(), word: "hello", startTime: 100, endTime: 101 },
			{ ...settings, learnedRules: new Map([["hello", [1, 2, 3]]]) },
		);
		expect(diagnostics).toContain("engine-output");
		expect(diagnostics).toContain("short-duration");
	});

	it("gives ignore rules and disabled switches precedence over remembered cuts", () => {
		const word = { ...newLyricWord(), word: "hello" };
		const rules = { ...config, learnedRules: new Map([["hello", [2]]]) };
		expect(
			segmentWord(word, { ...rules, ignoreList: new Set([" HELLO "]) }),
		).toEqual([word]);
		expect(segmentWord(word, { ...rules, splitEnglish: false })).toEqual([
			word,
		]);
	});
	it.each([
		"hello () world",
		"hello [] world",
		"hello(?!what)",
		"か\u3099く",
		"👨‍👩‍👧‍👦!",
		"مرحبا بالعالم",
		"किताब",
		"𠀀你好",
		"١٢٣",
	])("preserves source order and graphemes in %s", (text) => {
		for (const punctuationMode of ["merge", "standalone"] as const) {
			const parts = segmentWord(
				{ ...newLyricWord(), word: text },
				{ ...config, punctuationMode },
			).map((part) => part.word);
			expect(preservesSource(text, parts)).toBe(true);
		}
	});

	it("applies protected and learned lexical rules through shared punctuation handling", () => {
		const customRules = new Map([["hello", ["he", "llo"]]]);
		const learnedRules = new Map([["world", [3]]]);
		const parts = segmentWord(
			{ ...newLyricWord(), word: "(HELLO) world" },
			{ ...config, customRules, learnedRules },
		);
		expect(parts.map((part) => part.word)).toEqual([
			"(HE",
			"LLO)",
			" ",
			"wor",
			"ld",
		]);
	});

	it("does not match a protected substring within a word", () => {
		const parts = segmentWord(
			{ ...newLyricWord(), word: "hello" },
			{ ...config, customRules: new Map([["he", ["h", "e"]]]) },
		);
		expect(parts.map((part) => part.word)).toEqual(["hello"]);
	});

	it("rejects malformed custom splits and respects None and empty settings", () => {
		const word = {
			...newLyricWord(),
			word: "hello",
			startTime: 123.6,
			endTime: 0,
		};
		expect(
			segmentWord(word, {
				...config,
				customRules: new Map([["hello", ["bad"]]]),
			}),
		).toEqual([word]);
		expect(
			segmentWord(word, {
				...config,
				engine: "none",
				learnedRules: new Map([["hello", [2]]]),
			}),
		).toEqual([word]);
		const empty = { ...newLyricWord() };
		expect(
			segmentWord(empty, { ...config, removeEmptySegments: false }),
		).toEqual([empty]);
		expect(segmentWord(empty, config)).toEqual([]);
	});

	it("uses grapheme weights independently of punctuation placement", () => {
		const word = {
			...newLyricWord(),
			word: "(beautiful)",
			startTime: 0,
			endTime: 1000,
		};
		const result = recalculateWordTime(word, ["(beau", "ti", "ful)"], {
			...config,
			punctuationWeight: 0,
		});
		expect(result.map((part) => part.endTime - part.startTime)).toEqual([
			444, 223, 333,
		]);
		expect(graphemes("a\u0301👨‍👩‍👧‍👦𠀀")).toHaveLength(3);
	});
	it.each([
		'sorry,"',
		'"go."',
		'"Why?"',
		"Run!'",
		"“Hello,”",
		"‘over’",
		"'cause",
		"goin'",
	])("%s", (word) => {
		const parts = split(word);
		expect(parts.join("")).toBe(word);
		// No part is only punctuation.
		expect(parts.every((part) => /[\p{L}\p{N}]/u.test(part))).toBe(true);
	});
});
