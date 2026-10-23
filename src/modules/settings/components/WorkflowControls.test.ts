import { createStore } from "jotai";
import { describe, expect, it, vi } from "vitest";
import { bgLyricIgnoreSyncAtom, lyricLinesAtom } from "$/states/main";
import { newLyricLine } from "$/types/ttml";

vi.mock("$/modules/audio/audio-engine", () => ({ audioEngine: {} }));

import {
	backgroundSyncLanesAtom,
	backgroundSyncModeAtom,
	backgroundSyncSettingAtom,
} from "../states/background-sync";
import { parseSyncOffset } from "./WorkflowControls";

describe("shared workflow setting behavior", () => {
	it.each([
		["", 0],
		["invalid", 0],
		["Infinity", 0],
		["-123", -123],
		["12.9", 12],
		["1.2e3", 1],
	])("parses %s as the same whole-ms offset in both controls", (input, expected) => {
		expect(parseSyncOffset(input)).toBe(expected);
	});
	it("changes existing background lines from either setting control", () => {
		const store = createStore();
		const main = { ...newLyricLine(), ignoreSync: false };
		const bg = { ...newLyricLine(), isBG: true, ignoreSync: false };
		store.set(lyricLinesAtom, { metadata: [], lyricLines: [main, bg] });
		store.set(backgroundSyncSettingAtom, true);
		expect(store.get(bgLyricIgnoreSyncAtom)).toBe(true);
		expect(store.get(lyricLinesAtom).lyricLines[0]).toBe(main);
		expect(store.get(lyricLinesAtom).lyricLines[1].ignoreSync).toBe(true);
		expect(bg.ignoreSync).toBe(false);
		store.set(backgroundSyncSettingAtom, false);
		expect(store.get(lyricLinesAtom).lyricLines[1].ignoreSync).toBe(false);
	});
	it("switches between inline, separate pass and skip", () => {
		const store = createStore();
		const bg = { ...newLyricLine(), isBG: true, ignoreSync: false };
		const skippedByHand = { ...newLyricLine(), isBG: true, ignoreSync: true };
		store.set(lyricLinesAtom, {
			metadata: [],
			lyricLines: [bg, skippedByHand],
		});
		expect(store.get(backgroundSyncModeAtom)).toBe("inline");
		store.set(backgroundSyncModeAtom, "separate");
		expect(store.get(backgroundSyncLanesAtom)).toBe(true);
		expect(store.get(lyricLinesAtom).lyricLines[1].ignoreSync).toBe(true);
		store.set(backgroundSyncModeAtom, "skip");
		expect(store.get(backgroundSyncModeAtom)).toBe("skip");
		expect(store.get(backgroundSyncLanesAtom)).toBe(false);
		expect(store.get(lyricLinesAtom).lyricLines[0].ignoreSync).toBe(true);
		store.set(backgroundSyncModeAtom, "inline");
		expect(store.get(bgLyricIgnoreSyncAtom)).toBe(false);
		expect(store.get(lyricLinesAtom).lyricLines[0].ignoreSync).toBe(false);
	});
});
