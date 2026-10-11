import { describe, expect, it } from "vitest";
import { newLyricLine } from "$/types/ttml";
import { findCurrentLineIndex } from "./current-line";

const line = (startTime: number, endTime: number, isBG = false) => ({
	...newLyricLine(),
	startTime,
	endTime,
	isBG,
});

describe("findCurrentLineIndex", () => {
	it("returns no line for an empty or entirely untimed document", () => {
		expect(findCurrentLineIndex([], 100)).toBe(-1);
		expect(findCurrentLineIndex([line(0, 0), line(200, 100)], 100)).toBe(-1);
	});

	it("includes both timestamp boundaries and ignores zero-duration lines", () => {
		const lines = [line(100, 100), line(100, 200), line(300, 400)];
		expect(findCurrentLineIndex(lines, 100)).toBe(1);
		expect(findCurrentLineIndex(lines, 200)).toBe(1);
		expect(findCurrentLineIndex(lines, 300)).toBe(2);
	});

	it("prefers the active main line during overlap when focusing main lines", () => {
		const lines = [line(100, 300), line(150, 350, true)];
		expect(findCurrentLineIndex(lines, 200)).toBe(0);
	});

	it("follows the most recently started active line when not focusing main lines", () => {
		const lines = [line(100, 300), line(150, 350, true)];
		expect(findCurrentLineIndex(lines, 200, false)).toBe(1);
		expect(
			findCurrentLineIndex([line(100, 300, true), line(150, 350)], 200, false),
		).toBe(1);
		expect(
			findCurrentLineIndex([line(100, 300), line(100, 300, true)], 200, false),
		).toBe(0);
	});

	it("finds an active background line when no main line is active", () => {
		expect(findCurrentLineIndex([line(0, 50), line(100, 200, true)], 150)).toBe(
			1,
		);
	});

	it("uses the previous timed line in a gap, skipping untimed lines", () => {
		expect(
			findCurrentLineIndex([line(0, 50), line(0, 0), line(100, 200)], 75),
		).toBe(0);
	});

	it("uses the first timed line before playback and the last one afterwards", () => {
		const lines = [line(0, 0), line(100, 200), line(300, 400), line(0, 0)];
		expect(findCurrentLineIndex(lines, 0)).toBe(1);
		expect(findCurrentLineIndex(lines, 500)).toBe(2);
	});

	it("preserves source-order priority when multiple main lines are active", () => {
		expect(findCurrentLineIndex([line(100, 400), line(200, 300)], 250)).toBe(0);
	});
});
