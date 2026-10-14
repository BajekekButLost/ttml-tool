import { describe, expect, it } from "vitest";
import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml";
import { copyLinesAtTime, copyLinesIntoRange } from "./duplicate-paste";

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
