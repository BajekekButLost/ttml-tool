import { describe, expect, it } from "vitest";
import { newLyricLine } from "$/types/ttml";
import { groupAMLLLines } from "./line-groups";

describe("AMLL line grouping", () => {
	it("sorts without mutating the source and attaches backgrounds to the preceding main line", () => {
		const main = { ...newLyricLine(), id: "main", startTime: 100 };
		const bg = { ...newLyricLine(), id: "bg", startTime: 150, isBG: true };
		const next = {
			...newLyricLine(),
			id: "next",
			startTime: 200,
			isDuet: true,
		};
		const source = [next, main, bg];
		expect(groupAMLLLines(source)).toEqual([
			{ main, bg: [bg] },
			{ main: next, bg: [] },
		]);
		expect(source).toEqual([next, main, bg]);
	});
	it("preserves stable co-timed ordering, consecutive backgrounds and leading orphan backgrounds", () => {
		const orphan = { ...newLyricLine(), startTime: 0, isBG: true };
		const main = { ...newLyricLine(), startTime: 100 };
		const bg = { ...newLyricLine(), startTime: 100, isBG: true };
		const bg2 = { ...newLyricLine(), startTime: 100, isBG: true };
		expect(groupAMLLLines([orphan, main, bg, bg2])).toEqual([
			{ main: orphan, bg: [] },
			{ main, bg: [bg, bg2] },
		]);
		expect(groupAMLLLines([])).toEqual([]);
	});
});
