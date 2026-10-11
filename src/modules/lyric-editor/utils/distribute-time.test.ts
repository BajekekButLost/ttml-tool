import { describe, expect, it } from "vitest";
import { newLyricLine, newLyricWord } from "$/types/ttml";
import {
	type DistributionOptions,
	distributeLineTime,
	distributeTime,
} from "./distribute-time";
import { getSynchronizableUnits } from "./lyric-states";

const units = (texts: string[]) =>
	texts.map((word) => ({ word, startTime: 0, endTime: 0 }));

describe("distributeTime", () => {
	it("preserves caller policies for even, character, and custom syllable weights", () => {
		const words = units(["a", "long"]);
		expect(distributeTime(words, 100, 200).map((word) => word.endTime)).toEqual(
			[150, 200],
		);
		expect(
			distributeTime(words, 100, 200, { weight: "characters" }).map(
				(word) => word.endTime,
			),
		).toEqual([120, 200]);
		expect(
			distributeTime(words, 100, 200, { weight: [3, 1] }).map(
				(word) => word.endTime,
			),
		).toEqual([175, 200]);
		expect(words).toEqual(units(["a", "long"]));
	});
	it("covers the range exactly with monotonic nonnegative integer durations", () => {
		for (let count = 1; count <= 30; count++) {
			for (let duration = 0; duration <= 40; duration++) {
				for (const weight of [
					"even",
					"characters",
					Array.from({ length: count }, (_, i) => i % 4),
				] as const) {
					const input = units(
						Array.from({ length: count }, (_, i) => "x".repeat((i % 5) + 1)),
					);
					const result = distributeTime(input, 17, 17 + duration, { weight });
					expect(result[0].startTime).toBe(17);
					expect(result[result.length - 1]?.endTime).toBe(17 + duration);
					expect(
						result.reduce(
							(sum, word) => sum + word.endTime - word.startTime,
							0,
						),
					).toBe(duration);
					result.forEach((word, i) => {
						expect(
							Number.isInteger(word.startTime) &&
								Number.isInteger(word.endTime),
						).toBe(true);
						expect(word.endTime).toBeGreaterThanOrEqual(word.startTime);
						if (i > 0) expect(word.startTime).toBe(result[i - 1].endTime);
					});
				}
			}
		}
	});
	it("gives empty/space units zero duration and supports explicit inclusion", () => {
		const input = units(["", "a", " ", "b", ""]);
		expect(
			distributeTime(input, 10, 20).map((word) => [
				word.startTime,
				word.endTime,
			]),
		).toEqual([
			[10, 10],
			[10, 15],
			[15, 15],
			[15, 20],
			[20, 20],
		]);
		expect(
			distributeTime(units(["", " "]), 0, 10, { empty: "include" }).map(
				(word) => word.endTime,
			),
		).toEqual([5, 10]);
		expect(distributeTime(units([" "]), 0, 10)[0].endTime).toBe(0);
	});
	it("keeps zero-weight punctuation instead of dropping segments", () => {
		expect(
			distributeTime(units(["!", "?"]), 0, 3, { weight: [0, 0] }).map(
				(word) => word.endTime,
			),
		).toEqual([2, 3]);
	});
	it.each([
		[20.6, 10],
		[-20, 5.6],
		[Number.NaN, Number.POSITIVE_INFINITY],
	])("normalizes invalid or reversed ranges %s..%s", (start, end) => {
		const result = distributeTime(units(["a", "b"]), start, end);
		result.forEach((word) => {
			expect(Number.isInteger(word.startTime)).toBe(true);
			expect(word.startTime).toBeGreaterThanOrEqual(0);
			expect(word.endTime).toBeGreaterThanOrEqual(word.startTime);
		});
	});
	it("distributes ruby sub-units in reading order using their text", () => {
		const line = {
			...newLyricLine(),
			words: [
				{ ...newLyricWord(), word: "base", ruby: units(["a", " ", "bbb"]) },
				{ ...newLyricWord(), word: "cc" },
			],
		};
		const readingUnits = getSynchronizableUnits(line);
		const options: DistributionOptions = { weight: "characters" };
		expect(
			distributeTime(
				readingUnits.map((unit) => unit.rubyWord ?? unit.word),
				100,
				106,
				options,
			).map((word) => [word.startTime, word.endTime]),
		).toEqual([
			[100, 101],
			[101, 104],
			[104, 106],
		]);
		expect(distributeTime([], 0, 1)).toEqual([]);
	});
	it("updates ruby parents without stale zero-time spaces and never mutates a line", () => {
		const line = {
			...newLyricLine(),
			words: [
				{
					...newLyricWord(),
					word: "base",
					ruby: units([" ", "a", "bbb", " "]),
				},
				{ ...newLyricWord(), word: " " },
				{ ...newLyricWord(), word: "cc" },
			],
		};
		const result = distributeLineTime(line, 100, 106, { weight: "characters" });
		expect(result.words[0]).toMatchObject({ startTime: 100, endTime: 104 });
		expect(
			result.words[0].ruby?.map((ruby) => [ruby.startTime, ruby.endTime]),
		).toEqual([
			[100, 100],
			[100, 101],
			[101, 104],
			[104, 104],
		]);
		expect(result.words[1]).toMatchObject({ startTime: 104, endTime: 104 });
		expect(result.words[2]).toMatchObject({ startTime: 104, endTime: 106 });
		expect(result).toMatchObject({ startTime: 100, endTime: 106 });
		expect(line.words[0].ruby?.[1].endTime).toBe(0);
	});
});
