// @vitest-environment jsdom
import { createStore, Provider } from "jotai";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { smartLastWordAtom } from "$/modules/settings/states";
import {
	syncCommitOffsetAtom,
	syncLevelModeAtom,
	syncTimeOffsetAtom,
} from "$/modules/settings/states/sync";
import {
	keySyncEndAtom,
	keySyncNextAtom,
	keySyncStartAtom,
} from "$/states/keybindings";
import {
	lyricLinesAtom,
	selectedLinesAtom,
	selectedWordsAtom,
} from "$/states/main";
import { newLyricLine, newLyricWord } from "$/types/ttml";
import type { KeyBindingCallback } from "$/utils/keybindings";
import { SyncKeyBinding } from "./sync-keybinding";

const bindings = vi.hoisted(() => new Map<object, KeyBindingCallback>());
const audio = vi.hoisted(() => ({
	interpolatedCurrentTime: 1,
	musicPlayBackRate: 1,
	musicPlaying: false,
	resumeOrSeekMusic: vi.fn(),
}));
vi.mock("$/modules/audio/audio-engine", () => ({ audioEngine: audio }));
vi.mock("$/utils/keybindings", async (importOriginal) => ({
	...(await importOriginal<typeof import("$/utils/keybindings")>()),
	useKeyBindingAtom: (key: object, callback: KeyBindingCallback) =>
		bindings.set(key, callback),
}));
(
	globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function mount(mode: "word" | "line" = "word") {
	bindings.clear();
	const store = createStore();
	const words = ["a", " ", "bbb"].map((word) => ({ ...newLyricWord(), word }));
	const first = { ...newLyricLine(), words };
	const second = {
		...newLyricLine(),
		words: [{ ...newLyricWord(), word: "next" }],
	};
	const document = { metadata: [], lyricLines: [first, second] };
	store.set(lyricLinesAtom, document);
	store.set(selectedLinesAtom, new Set([first.id]));
	store.set(selectedWordsAtom, new Set([words[0].id]));
	store.set(syncLevelModeAtom, mode);
	store.set(syncTimeOffsetAtom, 0);
	store.set(syncCommitOffsetAtom, 0);
	store.set(smartLastWordAtom, false);
	const root = createRoot(globalThis.document.createElement("div"));
	act(() =>
		root.render(
			<Provider store={store}>
				<SyncKeyBinding />
			</Provider>,
		),
	);
	return {
		store,
		document,
		first,
		second,
		words,
		cleanup: () => act(() => root.unmount()),
	};
}

function press(key: object, seconds: number) {
	audio.interpolatedCurrentTime = seconds;
	const callback = bindings.get(key);
	if (!callback) throw new Error("Missing sync binding");
	const now = performance.now();
	act(() => callback({ downTime: now, downTimeOffset: 0, triggerTime: now }));
}

describe("normal-word sync controls", () => {
	it("F starts, G commits and advances past spaces, and H ends the last word", () => {
		const view = mount();
		try {
			press(keySyncStartAtom, 1);
			press(keySyncNextAtom, 2);
			expect(view.store.get(selectedWordsAtom)).toEqual(
				new Set([view.words[2].id]),
			);
			press(keySyncEndAtom, 3);
			const [first, second] = view.store.get(lyricLinesAtom).lyricLines;
			expect(first.words.map((word) => [word.startTime, word.endTime])).toEqual(
				[
					[1000, 2000],
					[0, 0],
					[2000, 3000],
				],
			);
			expect(first).toMatchObject({ startTime: 1000, endTime: 3000 });
			expect(view.store.get(selectedLinesAtom)).toEqual(new Set([second.id]));
			expect(view.store.get(selectedWordsAtom)).toEqual(
				new Set([second.words[0].id]),
			);
			expect(
				view.document.lyricLines[0].words.every(
					(word) => word.startTime === 0 && word.endTime === 0,
				),
			).toBe(true);
		} finally {
			view.cleanup();
		}
	});

	it("G on the song's last word ends the last line", () => {
		const view = mount();
		try {
			view.store.set(selectedLinesAtom, new Set([view.second.id]));
			view.store.set(selectedWordsAtom, new Set([view.second.words[0].id]));
			press(keySyncStartAtom, 4);
			press(keySyncNextAtom, 5);
			const second = view.store.get(lyricLinesAtom).lyricLines[1];
			expect(second.words[0]).toMatchObject({ startTime: 4000, endTime: 5000 });
			expect(second).toMatchObject({ startTime: 4000, endTime: 5000 });
		} finally {
			view.cleanup();
		}
	});

	it.each([
		keySyncNextAtom,
		keySyncEndAtom,
	])("distributes line timing by characters and advances in line mode", (key) => {
		const view = mount("line");
		try {
			press(keySyncStartAtom, 1);
			press(key, 2);
			const [first, second] = view.store.get(lyricLinesAtom).lyricLines;
			expect(first.words.map((word) => [word.startTime, word.endTime])).toEqual(
				[
					[1000, 1250],
					[1250, 1250],
					[1250, 2000],
				],
			);
			expect(first).toMatchObject({ startTime: 1000, endTime: 2000 });
			expect(view.store.get(selectedLinesAtom)).toEqual(new Set([second.id]));
			expect(view.store.get(selectedWordsAtom)).toEqual(
				new Set([second.words[0].id]),
			);
			expect(second.words[0].startTime).toBe(
				key === keySyncNextAtom ? 2000 : 0,
			);
		} finally {
			view.cleanup();
		}
	});
});
