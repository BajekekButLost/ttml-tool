import { createStore } from "jotai";
import { beforeAll, describe, expect, it, vi } from "vitest";
import en from "$/i18n/locales/en-US/translation.json";
import type { LyricLine } from "$/types/ttml";

let actions: typeof import("./actions");
let main: typeof import("$/states/main");
let dialogs: typeof import("$/states/dialogs");
let ttml: typeof import("$/types/ttml");
let settings: typeof import("$/modules/settings/states");
let sync: typeof import("$/modules/settings/states/sync");
let editAsText: typeof import("$/modules/edit-as-text/states");

beforeAll(async () => {
	const storage = new Map<string, string>();
	const localStorage = {
		getItem: (name: string) => storage.get(name) ?? null,
		setItem: (name: string, value: string) => storage.set(name, value),
		removeItem: (name: string) => storage.delete(name),
	};
	vi.stubGlobal("window", Object.assign(new EventTarget(), { localStorage }));
	vi.stubGlobal("localStorage", localStorage);
	vi.stubGlobal("navigator", { userAgent: "Windows" });
	actions = await import("./actions");
	main = await import("$/states/main");
	dialogs = await import("$/states/dialogs");
	ttml = await import("$/types/ttml");
	settings = await import("$/modules/settings/states");
	sync = await import("$/modules/settings/states/sync");
	editAsText = await import("$/modules/edit-as-text/states");
});

/** Returns the key so a test can check it exists in the en-US catalog. */
const keyOnly = (key: string) => key;

function hasKey(key: string): boolean {
	let node: unknown = en;
	for (const part of key.split(".")) {
		if (typeof node !== "object" || node === null || !(part in node))
			return false;
		node = (node as Record<string, unknown>)[part];
	}
	return typeof node === "string";
}

function storeWithLines(lines: LyricLine[]) {
	const store = createStore();
	store.set(main.lyricLinesAtom, {
		...store.get(main.lyricLinesAtom),
		lyricLines: lines,
	});
	return store;
}

function lineWithWords(count: number): LyricLine {
	const line = ttml.newLyricLine();
	line.words = Array.from({ length: count }, () => ttml.newLyricWord());
	return line;
}

const paletteIds = (mode: string, store = createStore()) =>
	actions.MENU_ACTION_LIST.filter((action) =>
		actions.paletteListsMenuAction(action, mode, store),
	).map((action) => action.id);

describe("menu action definitions", () => {
	it("have unique ids and labels that exist in en-US", () => {
		const ids = actions.MENU_ACTION_LIST.map((action) => action.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const action of actions.MENU_ACTION_LIST) {
			expect(hasKey(action.label(keyOnly)), action.id).toBe(true);
		}
		for (const label of Object.values(actions.MENU_ACTION_GROUP_LABELS)) {
			expect(hasKey(label(keyOnly))).toBe(true);
		}
	});

	it("gives export formats a label that names the export, not just the format", () => {
		const t = (_key: string, fallback: string) => fallback;
		expect(actions.MENU_ACTIONS.exportLrc.label(t)).toBe("LRC");
		expect(actions.MENU_ACTIONS.exportLrc.paletteLabel?.(t)).toBe(
			"Export lyrics: LRC",
		);
		expect(actions.MENU_ACTIONS.exportTtml.paletteLabel?.(t)).toBe(
			"Export lyrics: TTML",
		);
	});
});

describe("paletteListsMenuAction", () => {
	it("lists every menu action a keyboard command or Preferences page doesn't already cover", () => {
		expect(paletteIds("edit").sort()).toEqual(
			[
				"openFromClipboard",
				"restoreFromHistory",
				"saveToClipboard",
				"importLyrics",
				"export.ttml",
				"export.lrc",
				"export.eslrc",
				"export.qrc",
				"export.yrc",
				"export.lys",
				"export.ass",
				"timeShift",
				"timeStretch",
				"editMetadata",
				"editAsText",
				"preferences",
				"swapDuetSelected",
				"combineWords",
				"advancedSegment",
				"learnedSplits",
				"syncLineTimestamps",
				"swapDuetAll",
				"spectrogramHoverSync",
				"latencyTest",
				"ttmlChecklist",
				"geniusSearch",
				"startGuide",
				"github",
				"guides",
			].sort(),
		);
	});

	it("leaves actions with a keyboard command to the command's own entry", () => {
		const covered = actions.MENU_ACTION_LIST.filter((action) => action.command);
		expect(covered.map((action) => action.id).sort()).toEqual(
			[
				"autoSegment",
				"deleteSelection",
				"newFile",
				"openFile",
				"redo",
				"saveFile",
				"selectAll",
				"undo",
				"unselectAll",
			].sort(),
		);
		for (const id of paletteIds("edit")) {
			expect(covered.some((action) => action.id === id)).toBe(false);
		}
	});

	it("keeps the selection actions to Edit mode", () => {
		for (const mode of ["sync", "preview"]) {
			const ids = paletteIds(mode);
			expect(ids).not.toContain("swapDuetSelected");
			expect(ids).not.toContain("combineWords");
			expect(ids).toContain("swapDuetAll");
			expect(ids).toContain("importLyrics");
		}
	});

	it("shows Projects only with folder projects on, like the File menu", () => {
		const store = createStore();
		expect(paletteIds("edit", store)).not.toContain("projects");
		store.set(settings.folderProjectsEnabledAtom, true);
		expect(paletteIds("edit", store)).toContain("projects");
	});
});

describe("enabled rules", () => {
	const isEnabled = (
		action: import("./actions").MenuAction,
		store: ReturnType<typeof createStore>,
	) => (action.enabledAtom ? store.get(action.enabledAtom) : true);

	it("greys out Swap main and duet lines with no lines", () => {
		const { swapDuetAll } = actions.MENU_ACTIONS;
		expect(isEnabled(swapDuetAll, storeWithLines([]))).toBe(false);
		expect(isEnabled(swapDuetAll, storeWithLines([lineWithWords(1)]))).toBe(
			true,
		);
	});

	it("needs selected lines to swap the selection", () => {
		const line = lineWithWords(1);
		const store = storeWithLines([line]);
		expect(isEnabled(actions.MENU_ACTIONS.swapDuetSelected, store)).toBe(false);
		store.set(main.selectedLinesAtom, new Set([line.id]));
		expect(isEnabled(actions.MENU_ACTIONS.swapDuetSelected, store)).toBe(true);
	});

	it("needs two or more words in one line to combine", () => {
		const first = lineWithWords(3);
		const second = lineWithWords(1);
		const store = storeWithLines([first, second]);
		const { combineWords } = actions.MENU_ACTIONS;
		store.set(main.selectedLinesAtom, new Set([first.id]));
		store.set(main.selectedWordsAtom, new Set([first.words[0].id]));
		expect(isEnabled(combineWords, store)).toBe(false);
		store.set(
			main.selectedWordsAtom,
			new Set([first.words[0].id, first.words[1].id]),
		);
		expect(isEnabled(combineWords, store)).toBe(true);
		store.set(main.selectedLinesAtom, new Set([first.id, second.id]));
		expect(isEnabled(combineWords, store)).toBe(false);
	});
});

describe("running actions", () => {
	const context = (store: ReturnType<typeof createStore>) =>
		({
			store,
			t: (_key: string, fallback: string) => fallback,
			menu: {},
		}) as unknown as import("./actions").MenuActionContext;

	it("swaps every line, or only the selected ones", () => {
		const first = lineWithWords(1);
		const second = lineWithWords(1);
		const store = storeWithLines([first, second]);
		actions.MENU_ACTIONS.swapDuetAll.run(context(store));
		expect(
			store.get(main.lyricLinesAtom).lyricLines.map((line) => line.isDuet),
		).toEqual([true, true]);
		store.set(main.selectedLinesAtom, new Set([second.id]));
		actions.MENU_ACTIONS.swapDuetSelected.run(context(store));
		expect(
			store.get(main.lyricLinesAtom).lyricLines.map((line) => line.isDuet),
		).toEqual([true, false]);
	});

	it("opens Combine words for the selected words' line", () => {
		const first = lineWithWords(1);
		const second = lineWithWords(2);
		const store = storeWithLines([first, second]);
		store.set(main.selectedLinesAtom, new Set([second.id]));
		actions.MENU_ACTIONS.combineWords.run(context(store));
		expect(store.get(dialogs.combineWordsDialogAtom)).toEqual({
			open: true,
			lineIndex: 1,
		});
	});

	it("opens dialogs and flips toggles", () => {
		const store = createStore();
		actions.MENU_ACTIONS.editAsText.run(context(store));
		expect(store.get(editAsText.editAsTextDialogAtom)).toBe(true);
		actions.MENU_ACTIONS.importLyrics.run(context(store));
		expect(store.get(dialogs.importLyricsDialogAtom)).toBe(true);
		const before = store.get(sync.spectrogramHoverSyncEnabledAtom);
		actions.MENU_ACTIONS.spectrogramHoverSync.run(context(store));
		expect(store.get(sync.spectrogramHoverSyncEnabledAtom)).toBe(!before);
	});
});
