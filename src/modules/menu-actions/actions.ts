import { type Atom, atom, type createStore } from "jotai";
import type { useTopMenuActions } from "$/components/TopMenu/useTopMenuActions";
import { editAsTextDialogAtom } from "$/modules/edit-as-text/states";
import {
	cmdAutoSegmentDialog,
	cmdDeleteSelection,
	cmdNewFile,
	cmdOpenFile,
	cmdRedo,
	cmdSaveFile,
	cmdSelectAll,
	cmdUndo,
	cmdUnselectAll,
} from "$/modules/keyboard/commands";
import type {
	KeyBindingCommand,
	KeyBindingMode,
} from "$/modules/keyboard/types";
import { swapDuetLinesAtom } from "$/modules/lyric-editor/utils/swap-duet";
import { guideWelcomeOpenAtom } from "$/modules/onboarding/states";
import type { LyricExportFormat } from "$/modules/project/export-lyric";
import { folderProjectsEnabledAtom } from "$/modules/settings/states";
import { spectrogramHoverSyncEnabledAtom } from "$/modules/settings/states/sync";
import {
	changelogDialogAtom,
	combineWordsDialogAtom,
	geniusSearchDialogAtom,
	importLyricsDialogAtom,
	settingsDialogAtom,
	settingsTabAtom,
} from "$/states/dialogs.ts";
import {
	lyricLinesAtom,
	selectedLinesAtom,
	selectedWordsAtom,
} from "$/states/main.ts";

type Store = ReturnType<typeof createStore>;
type Translate = (key: string, fallback: string) => string;

export interface MenuActionContext {
	store: Store;
	t: Translate;
	menu: ReturnType<typeof useTopMenuActions>;
}

export type MenuActionGroup = "file" | "edit" | "tools" | "help";

/**
 * One action from the top menus (or a selection action from the right-click
 * menus), defined once so the menu item and its command palette entry share
 * the label, the enabled rule and what it runs.
 */
export interface MenuAction {
	id: string;
	group: MenuActionGroup;
	/** The menu item's label. */
	label: (t: Translate) => string;
	/** The palette's label when the menu's needs its submenu to make sense, e.g. "LRC". */
	paletteLabel?: (t: Translate) => string;
	/** Already a keyboard command, so the palette lists that instead. */
	command?: KeyBindingCommand;
	/** Left out of the palette because another entry covers it, e.g. a Preferences page. */
	paletteHidden?: boolean;
	/** Editor modes the palette lists it in. All of them when unset. */
	modes?: readonly KeyBindingMode[];
	enabledAtom?: Atom<boolean>;
	visibleAtom?: Atom<boolean>;
	/** Set for toggles: the menu shows a checkbox and the palette a check mark. */
	checkedAtom?: Atom<boolean>;
	/** May return a promise; what it resolves to is ignored. */
	run: (context: MenuActionContext) => unknown;
}

const hasLyricLinesAtom = atom(
	(get) => get(lyricLinesAtom).lyricLines.length > 0,
);
const hasSelectedLinesAtom = atom((get) => get(selectedLinesAtom).size > 0);
/** Combine words works on two or more words in one line, like its right-click item. */
const canCombineWordsAtom = atom(
	(get) => get(selectedWordsAtom).size > 1 && get(selectedLinesAtom).size === 1,
);

const exportAction = (
	id: LyricExportFormat,
	key: string,
	fallback: string,
): MenuAction => ({
	id: `export.${id}`,
	group: "file",
	label: (t) => t(key, fallback),
	paletteLabel: (t) =>
		`${t("topBar.menu.exportLyric.export", "Export lyrics")}: ${t(key, fallback)}`,
	// Loaded on use: the stringifiers aren't needed until someone exports.
	run: ({ store, t }) =>
		import("$/modules/project/export-lyric").then(({ exportLyric }) =>
			exportLyric(store, t, id),
		),
});

export const MENU_ACTIONS = {
	// File
	newFile: {
		id: "newFile",
		group: "file",
		label: (t) => t("topBar.menu.newLyric", "New TTML file"),
		command: cmdNewFile,
		run: ({ menu }) => menu.onNewFile(),
	},
	openFile: {
		id: "openFile",
		group: "file",
		label: (t) => t("topBar.menu.openLyric", "Open TTML file"),
		command: cmdOpenFile,
		run: ({ menu }) => menu.onOpenFile(),
	},
	openFromClipboard: {
		id: "openFromClipboard",
		group: "file",
		label: (t) =>
			t("topBar.menu.openFromClipboard", "Open TTML file from clipboard"),
		run: ({ menu }) => menu.onOpenFileFromClipboard(),
	},
	saveFile: {
		id: "saveFile",
		group: "file",
		label: (t) => t("topBar.menu.saveLyric", "Save TTML file"),
		command: cmdSaveFile,
		run: ({ menu }) => menu.onSaveFile(),
	},
	projects: {
		id: "projects",
		group: "file",
		label: (t) => t("topBar.menu.projects", "Projects"),
		visibleAtom: folderProjectsEnabledAtom,
		run: ({ menu }) => menu.onOpenProjects(),
	},
	restoreFromHistory: {
		id: "restoreFromHistory",
		group: "file",
		label: (t) =>
			t("topBar.menu.restoreFromHistory", "Restore from history..."),
		run: ({ menu }) => menu.onOpenHistoryRestore(),
	},
	saveToClipboard: {
		id: "saveToClipboard",
		group: "file",
		label: (t) =>
			t("topBar.menu.saveLyricToClipboard", "Save TTML file to clipboard"),
		run: ({ menu }) => menu.onSaveFileToClipboard(),
	},
	importLyrics: {
		id: "importLyrics",
		group: "file",
		label: (t) => t("topBar.menu.importLyric.import", "Import lyrics..."),
		run: ({ store }) => store.set(importLyricsDialogAtom, true),
	},
	exportTtml: {
		id: "export.ttml",
		group: "file",
		label: (t) => t("topBar.menu.exportLyric.toTTML", "TTML"),
		paletteLabel: (t) =>
			`${t("topBar.menu.exportLyric.export", "Export lyrics")}: ${t("topBar.menu.exportLyric.toTTML", "TTML")}`,
		run: ({ menu }) => menu.onSaveFile(),
	},
	exportLrc: exportAction("lrc", "topBar.menu.exportLyric.toLRC", "LRC"),
	exportEslrc: exportAction(
		"eslrc",
		"topBar.menu.exportLyric.toESLRC",
		"ESLRC",
	),
	exportQrc: exportAction("qrc", "topBar.menu.exportLyric.toQRC", "QRC"),
	exportYrc: exportAction("yrc", "topBar.menu.exportLyric.toYRC", "YRC"),
	exportLys: exportAction(
		"lys",
		"topBar.menu.exportLyric.toLrcfySylb",
		"Lyricify Syllable",
	),
	exportAss: exportAction(
		"ass",
		"topBar.menu.exportLyric.toASS",
		"ASS subtitles",
	),

	// Edit
	undo: {
		id: "undo",
		group: "edit",
		label: (t) => t("topBar.menu.undo", "Undo"),
		command: cmdUndo,
		run: ({ menu }) => menu.onUndo(),
	},
	redo: {
		id: "redo",
		group: "edit",
		label: (t) => t("topBar.menu.redo", "Redo"),
		command: cmdRedo,
		run: ({ menu }) => menu.onRedo(),
	},
	selectAll: {
		id: "selectAll",
		group: "edit",
		label: (t) => t("topBar.menu.selectAllLines", "Select all lines"),
		command: cmdSelectAll,
		run: ({ menu }) => menu.onSelectAll(),
	},
	unselectAll: {
		id: "unselectAll",
		group: "edit",
		label: (t) => t("topBar.menu.unselectAllLines", "Unselect all lines"),
		command: cmdUnselectAll,
		run: ({ menu }) => menu.onUnselectAll(),
	},
	deleteSelection: {
		id: "deleteSelection",
		group: "edit",
		label: (t) =>
			t("settingsDialog.keybindings.deleteSelection", "Delete selection"),
		command: cmdDeleteSelection,
		run: ({ menu }) => menu.onDeleteSelection(),
	},
	timeShift: {
		id: "timeShift",
		group: "edit",
		label: (t) => t("topBar.menu.timeShift", "Time shift..."),
		run: ({ menu }) => menu.onOpenTimeShift(),
	},
	timeStretch: {
		id: "timeStretch",
		group: "edit",
		label: (t) => t("topBar.menu.timeStretch", "Time stretch..."),
		run: ({ menu }) => menu.onOpenTimeStretch(),
	},
	editMetadata: {
		id: "editMetadata",
		group: "edit",
		label: (t) => t("topBar.menu.editMetadata", "Edit lyric metadata"),
		run: ({ menu }) => menu.onOpenMetadataEditor(),
	},
	editAsText: {
		id: "editAsText",
		group: "edit",
		label: (t) => t("editAsText.menuItem", "Edit as text..."),
		run: ({ store }) => store.set(editAsTextDialogAtom, true),
	},
	preferences: {
		id: "preferences",
		group: "edit",
		label: (t) => t("settingsDialog.title", "Preferences"),
		run: ({ menu }) => menu.onOpenSettings(),
	},
	// Right-click selection actions, palette only.
	swapDuetSelected: {
		id: "swapDuetSelected",
		group: "edit",
		label: (t) => t("editModeTools.swapDuetSelected", "Swap main and duet"),
		modes: ["edit"],
		enabledAtom: hasSelectedLinesAtom,
		run: ({ store }) =>
			store.set(swapDuetLinesAtom, store.get(selectedLinesAtom)),
	},
	combineWords: {
		id: "combineWords",
		group: "edit",
		label: (t) => t("contextMenu.combineWords", "Combine words"),
		modes: ["edit"],
		enabledAtom: canCombineWordsAtom,
		run: ({ store }) => {
			const selectedLines = store.get(selectedLinesAtom);
			const lineIndex = store
				.get(lyricLinesAtom)
				.lyricLines.findIndex((line) => selectedLines.has(line.id));
			if (lineIndex !== -1)
				store.set(combineWordsDialogAtom, { open: true, lineIndex });
		},
	},

	// Tools
	autoSegment: {
		id: "autoSegment",
		group: "tools",
		label: (t) => t("topBar.menu.autoSegment", "Auto segment..."),
		command: cmdAutoSegmentDialog,
		run: ({ menu }) => menu.onAutoSegment(),
	},
	advancedSegment: {
		id: "advancedSegment",
		group: "tools",
		label: (t) => t("topBar.menu.advancedSegment", "Advanced segmentation..."),
		run: ({ menu }) => menu.onOpenAdvancedSegmentation(),
	},
	learnedSplits: {
		id: "learnedSplits",
		group: "tools",
		label: (t) => t("topBar.menu.learnedSplits", "Learned splits..."),
		run: ({ menu }) => menu.onOpenLearnedSplits(),
	},
	syncLineTimestamps: {
		id: "syncLineTimestamps",
		group: "tools",
		label: (t) =>
			t("topBar.menu.syncLineTimestamps", "Fit lines to their words"),
		run: ({ menu }) => menu.onSyncLineTimestamps(),
	},
	swapDuetAll: {
		id: "swapDuetAll",
		group: "tools",
		label: (t) => t("editModeTools.swapDuetAll", "Swap main and duet lines"),
		enabledAtom: hasLyricLinesAtom,
		run: ({ store }) => store.set(swapDuetLinesAtom),
	},
	spectrogramHoverSync: {
		id: "spectrogramHoverSync",
		group: "tools",
		label: (t) =>
			t("topBar.menu.spectrogramHoverSync", "Sync at mouse position"),
		checkedAtom: spectrogramHoverSyncEnabledAtom,
		run: ({ store }) =>
			store.set(
				spectrogramHoverSyncEnabledAtom,
				!store.get(spectrogramHoverSyncEnabledAtom),
			),
	},
	latencyTest: {
		id: "latencyTest",
		group: "tools",
		label: (t) =>
			t("settingsDialog.common.latencyTest", "Audio/input latency test"),
		run: ({ menu }) => menu.onOpenLatencyTest(),
	},
	ttmlChecklist: {
		id: "ttmlChecklist",
		group: "tools",
		label: (t) => t("topBar.menu.ttmlChecklist", "TTML checklist"),
		run: ({ menu }) => menu.onOpenTTMLChecklist(),
	},
	// The metadata editor's Genius button, palette only.
	geniusSearch: {
		id: "geniusSearch",
		group: "tools",
		label: (t) =>
			t(
				"metadataDialog.fetchSongwriters.button",
				"Fetch songwriters from Genius",
			),
		run: ({ store }) => store.set(geniusSearchDialogAtom, true),
	},

	// Help
	startGuide: {
		id: "startGuide",
		group: "help",
		label: (t) => t("beginnerGuide.menu", "Start guide"),
		run: ({ store }) => store.set(guideWelcomeOpenAtom, true),
	},
	github: {
		id: "github",
		group: "help",
		label: (t) => t("aboutModal.github", "Star on GitHub"),
		run: ({ menu }) => menu.onOpenGitHub(),
	},
	guides: {
		id: "guides",
		group: "help",
		label: (t) => t("topBar.menu.helpDoc", "TTML guides"),
		run: ({ menu }) => menu.onOpenGuides(),
	},
	changelog: {
		id: "changelog",
		group: "help",
		label: (t) => t("topBar.menu.changelog", "Changelog & updates"),
		paletteHidden: true,
		run: ({ store }) => store.set(changelogDialogAtom, true),
	},
	about: {
		id: "about",
		group: "help",
		label: (t) => t("common.about", "About"),
		paletteHidden: true,
		run: ({ store }) => {
			store.set(settingsTabAtom, "about");
			store.set(settingsDialogAtom, true);
		},
	},
} satisfies Record<string, MenuAction>;

export const MENU_ACTION_LIST: readonly MenuAction[] =
	Object.values(MENU_ACTIONS);

/** The top menu's name for each group, used as a search keyword. */
export const MENU_ACTION_GROUP_LABELS: Record<
	MenuActionGroup,
	(t: Translate) => string
> = {
	file: (t) => t("topBar.menu.file", "File"),
	edit: (t) => t("topBar.menu.edit", "Edit"),
	tools: (t) => t("topBar.menu.tool", "Tools"),
	help: (t) => t("topBar.menu.help", "Help"),
};

/**
 * Whether the palette lists a menu action: not one a keyboard command or a
 * Preferences page already covers, runnable in this mode, and visible in its
 * menu (Projects only shows with folder projects on).
 */
export function paletteListsMenuAction(
	action: MenuAction,
	mode: string,
	store: Store,
): boolean {
	if (action.command || action.paletteHidden) return false;
	if (action.modes && !(action.modes as readonly string[]).includes(mode))
		return false;
	return action.visibleAtom ? store.get(action.visibleAtom) : true;
}
