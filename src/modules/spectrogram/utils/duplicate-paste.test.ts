import { describe, expect, it } from "vitest";
import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml";
import {
	copyLinesAtTime,
	copyLinesIntoRange,
	insertDuplicatedLines,
} from "./duplicate-paste";

const word = (text: string, start: number, end: number) => ({
	...newLyricWord(),
	word: text,
	startTime: start,
	endTime: end,
});

const line = (words: ReturnType<typeof word>[]): LyricLine => ({
	...newLyricLine(),
	startTime: words[0]?.startTime ?? 0,
	endTime: words[words.length - 1]?.endTime ?? 0,
	words,
});

const times = (items: { startTime: number; endTime: number }[] = []) =>
	items.map((item) => [item.startTime, item.endTime]);

describe("copyLinesIntoRange", () => {
	it("splits the range between lines and words evenly", () => {
		const copies = copyLinesIntoRange(
			[line([word("a", 0, 5), word("b", 5, 9)]), line([word("c", 9, 20)])],
			1000,
			2000,
		);
		expect(times(copies)).toEqual([
			[1000, 1500],
			[1500, 2000],
		]);
		expect(times(copies[0].words)).toEqual([
			[1000, 1250],
			[1250, 1500],
		]);
	});

	it("gives copies new ids and leaves the source lines untouched", () => {
		const source = line([word("漢字", 0, 20)]);
		const before = structuredClone(source);
		const [copy] = copyLinesIntoRange([source], 1000, 1400);
		expect(source).toEqual(before);
		expect(copy.id).not.toBe(source.id);
		expect(copy.words[0].id).not.toBe(source.words[0].id);
	});
});

describe("copyLinesAtTime", () => {
	it("shifts lines and words so the earliest line starts at the time", () => {
		const [copy] = copyLinesAtTime([line([word("漢字", 100, 120)])], 1000);
		expect(times([copy])).toEqual([[1000, 1020]]);
		expect(times(copy.words)).toEqual([[1000, 1020]]);
	});
});

describe("insertDuplicatedLines", () => {
	it("inserts copies of the selected lines in time order at the target", () => {
		const first = line([word("a", 0, 1000)]);
		const second = line([word("b", 5000, 6000)]);
		const lyricLines = [first, second];

		const inserted = insertDuplicatedLines(lyricLines, new Set([first.id]), {
			start: 3000,
		});

		expect(inserted).toBe(1);
		expect(lyricLines.map((l) => l.words[0].word)).toEqual(["a", "a", "b"]);
		expect(times(lyricLines[1].words)).toEqual([[3000, 4000]]);
		expect(lyricLines[1].id).not.toBe(first.id);
	});

	it("fills a range when one is given", () => {
		const source = line([word("a", 0, 1000)]);
		const lyricLines = [source];

		insertDuplicatedLines(lyricLines, new Set([source.id]), {
			start: 2000,
			end: 2600,
		});

		expect(times(lyricLines.slice(1))).toEqual([[2000, 2600]]);
	});

	it("does nothing without a selection", () => {
		const lyricLines = [line([word("a", 0, 1000)])];
		expect(insertDuplicatedLines(lyricLines, new Set(), { start: 0 })).toBe(0);
		expect(lyricLines).toHaveLength(1);
	});

	it("puts copies landing inside a section into that section", () => {
		const inSection = (l: LyricLine, header: string) => ({
			...l,
			sectionId: "verse",
			geniusHeader: header,
		});
		const source = line([word("x", 0, 500)]);
		const first = inSection(line([word("a", 1000, 2000)]), "[Verse]");
		const second = inSection(line([word("b", 5000, 6000)]), "[Verse]");
		const lyricLines = [source, first, second];

		insertDuplicatedLines(lyricLines, new Set([source.id]), { start: 3000 });

		expect(lyricLines[2].sectionId).toBe("verse");
		expect(lyricLines[2].geniusHeader).toBe("[Verse]");
	});
});
