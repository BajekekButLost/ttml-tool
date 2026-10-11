import { describe, expect, it } from "vitest";
import { lrcToPlainLyrics, parseLrc } from "./parse-lrc";

describe("shared LRC timestamps", () => {
	it.each([
		["[01:02]", 62000],
		["[1:2]", 62000],
		["[01:02.34]", 62340],
		["[01:02:34]", 62340],
		["[01:02.345]", 62345],
		["[01:02:345]", 62345],
		["[01:02.3]", 62300],
		["[123:02.34]", 7382340],
		["[02]", 2000],
		["[02.34]", 2340],
	])("reads %s in file and online imports", (tag, expected) => {
		const [line] = parseLrc(`${tag}  hello  `);
		expect(line.startTime).toBe(expected);
		expect(line.words[0].word).toBe("hello");
		expect(line.isLineSynced).toBe(true);
		expect(lrcToPlainLyrics(`${tag}  hello  `)).toBe("hello");
	});

	it("expands repeated timestamps while plain import keeps the source row once", () => {
		const input = "[00:20][00:10.123] repeat\r\n[00:30] end";
		expect(parseLrc(input).map((line) => line.startTime)).toEqual([
			10123, 20000, 30000,
		]);
		expect(lrcToPlainLyrics(input)).toBe("repeat\nend");
	});

	it("ignores metadata and applies the last signed offset to every timestamp", () => {
		const input =
			"[ar:Artist]\n[ti:Title]\n[offset:200]\n[00:01] one\n[offset:-500]";
		expect(parseLrc(input)[0].startTime).toBe(500);
		expect(lrcToPlainLyrics(input)).toBe("one");
		expect(parseLrc("[offset:-5000]\n[00:01] one")[0].startTime).toBe(0);
	});

	it("preserves translation/romanization grouping and extra simultaneous lyrics", () => {
		const lines = parseLrc(
			"[00:01] main\n[00:01] translation\n[00:01] roman\n[00:01] extra\n[00:03]\n[00:05] last",
		);
		expect(lines).toHaveLength(3);
		expect(lines[0].translatedLyric).toBe("translation");
		expect(lines[0].romanLyric).toBe("roman");
		expect(lines[0].endTime).toBe(3000);
		expect(lines[1].words[0].word).toBe("extra");
		expect(lines[2].endTime).toBe(15000);
	});

	it("keeps untimed text for online import, but never invents file timing", () => {
		expect(lrcToPlainLyrics("untimed\r[00:01] timed\r[broken] text")).toBe(
			"untimed\ntimed\n[broken] text",
		);
		expect(parseLrc("untimed\n[broken] text")).toEqual([]);
	});
});
