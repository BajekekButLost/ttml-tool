import { produce } from "immer";
import { describe, expect, it } from "vitest";
import {
	type LyricLine,
	type LyricWord,
	newLyricLine,
	newLyricWord,
} from "$/types/ttml";
import {
	applySelectedDuration,
	applySelectedField,
	getSelectedDuration,
	getSelectedFieldValue,
	MULTIPLE_VALUES,
	selectionHasTimingError,
} from "./selection-values";

const word = (id: string, startTime: number, endTime: number): LyricWord => ({
	...newLyricWord(),
	id,
	word: id,
	startTime,
	endTime,
});
const line = (id: string, words: LyricWord[] = []): LyricLine => ({
	...newLyricLine(),
	id,
	startTime: 100,
	endTime: 300,
	words,
});
const ids = (...values: string[]) => new Set(values);

describe("multi-selection ribbon values", () => {
	it("distinguishes no selection, missing IDs, identical values and mixed values", () => {
		const lines = [line("a"), { ...line("b"), startTime: 200 }];
		const value = (selected: Set<string>) =>
			getSelectedFieldValue<LyricLine, "startTime", string>(
				lines,
				selected,
				false,
				"startTime",
				String,
			);
		expect(value(ids())).toBeUndefined();
		expect(value(ids("missing"))).toBe(MULTIPLE_VALUES);
		expect(value(ids("a"))).toBe("100");
		expect(value(ids("a", "b"))).toBe(MULTIPLE_VALUES);
		expect(
			getSelectedFieldValue<LyricLine, "endTime">(
				lines,
				ids("a", "b"),
				false,
				"endTime",
				(v) => v,
			),
		).toBe(300);
	});

	it("merges words across lines and formats optional undefined values", () => {
		const lines = [
			line("a", [word("x", 0, 100)]),
			line("b", [word("y", 100, 200)]),
		];
		expect(
			getSelectedFieldValue<LyricWord, "obscene">(
				lines,
				ids("x", "y"),
				true,
				"obscene",
				(v) => v,
			),
		).toBe(false);
		expect(
			getSelectedFieldValue<LyricWord, "romanWarning", string>(
				lines,
				ids("x", "y"),
				true,
				"romanWarning",
				String,
			),
		).toBe("undefined");
		expect(getSelectedDuration(lines, ids("x", "y"), true)).toBe(100);
		expect(getSelectedDuration(lines, ids("a", "b"), false)).toBe(200);
		expect(getSelectedDuration(lines, ids(), true)).toBeUndefined();
		expect(getSelectedDuration(lines, ids("missing"), true)).toBe(
			MULTIPLE_VALUES,
		);
	});

	it("reports timing errors only in selected items of the requested kind", () => {
		const lines = [
			line("a", [word("bad", 200, 100), word("good", 0, 0)]),
			{ ...line("b"), endTime: 50 },
		];
		expect(selectionHasTimingError(lines, ids("bad"), true)).toBe(true);
		expect(selectionHasTimingError(lines, ids("good"), true)).toBe(false);
		expect(selectionHasTimingError(lines, ids("a"), false)).toBe(false);
		expect(selectionHasTimingError(lines, ids("b"), false)).toBe(true);
	});
});

describe("multi-selection ribbon edits", () => {
	it("updates all selected words without mutating inputs or replacing untouched lines/words", () => {
		const lines = [
			line("a", [word("x", 0, 100), word("y", 100, 200)]),
			line("b", [word("z", 0, 100)]),
			line("c"),
		];
		const edited = applySelectedField<LyricWord, "word">(
			lines,
			ids("x", "z"),
			true,
			"word",
			"new",
		);
		expect(edited[0].words[0].word).toBe("new");
		expect(edited[1].words[0].word).toBe("new");
		expect(lines[0].words[0].word).toBe("x");
		expect(edited[0].words[1]).toBe(lines[0].words[1]);
		expect(edited[2]).toBe(lines[2]);
		expect(
			applySelectedField<LyricWord, "word">(lines, ids(), true, "word", "new"),
		).toBe(lines);
	});

	it("retains structural sharing inside the existing Immer atom update", () => {
		const state = { lyricLines: [line("a"), line("b"), line("c")] };
		const edited = produce(state, (draft) => {
			draft.lyricLines = applySelectedField<LyricLine, "isBG">(
				draft.lyricLines,
				ids("a", "b"),
				false,
				"isBG",
				true,
			);
		});
		expect(edited.lyricLines.map((l) => l.isBG)).toEqual([true, true, false]);
		expect(edited.lyricLines[2]).toBe(state.lyricLines[2]);
		expect(state.lyricLines[0].isBG).toBe(false);
	});

	it("sets absolute durations without moving neighboring word starts", () => {
		const lines = [line("a", [word("x", 0, 100), word("y", 100, 200)])];
		const edited = applySelectedDuration(lines, ids("x"), true, 150, false);
		expect(edited[0].words[0].endTime).toBe(150);
		expect(edited[0].words[1]).toBe(lines[0].words[1]);
	});

	it("applies deltas in two passes to connected selected words", () => {
		const lines = [
			line("a", [word("x", 0, 100), word("y", 100, 200), word("z", 200, 300)]),
		];
		const edited = applySelectedDuration(lines, ids("x", "y"), true, 50, true);
		expect(edited[0].words.map((w) => [w.startTime, w.endTime])).toEqual([
			[0, 150],
			[150, 250],
			[250, 300],
		]);
		expect(lines[0].words[1].startTime).toBe(100);
	});

	it("keeps gaps and refuses to invert an unselected neighbor", () => {
		const lines = [
			line("a", [word("x", 0, 100), word("y", 100, 120), word("z", 150, 200)]),
		];
		const edited = applySelectedDuration(lines, ids("x", "y"), true, 40, true);
		expect(edited[0].words.map((w) => [w.startTime, w.endTime])).toEqual([
			[0, 140],
			[140, 160],
			[150, 200],
		]);
		const one = applySelectedDuration(lines, ids("x"), true, 40, true);
		expect(one[0].words[1]).toBe(lines[0].words[1]);
	});

	it("clamps negative word/line deltas and leaves unrelated items intact", () => {
		const lines = [line("a", [word("x", 0, 100)]), line("b")];
		expect(
			applySelectedDuration(lines, ids("x"), true, -500, true)[0].words[0]
				.endTime,
		).toBe(0);
		const edited = applySelectedDuration(lines, ids("a"), false, -500, true);
		expect(edited[0].endTime).toBe(100);
		expect(edited[1]).toBe(lines[1]);
	});
});
