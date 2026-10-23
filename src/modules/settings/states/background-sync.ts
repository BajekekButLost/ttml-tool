import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { bgLyricIgnoreSyncAtom, lyricLinesAtom } from "$/states/main";

/** The setting updates existing background lines as well as future sync behavior. */
export const backgroundSyncSettingAtom = atom(
	(get) => get(bgLyricIgnoreSyncAtom),
	(get, set, ignore: boolean) => {
		set(bgLyricIgnoreSyncAtom, ignore);
		const lyric = get(lyricLinesAtom);
		set(lyricLinesAtom, {
			...lyric,
			lyricLines: lyric.lyricLines.map((line) =>
				line.isBG ? { ...line, ignoreSync: ignore } : line,
			),
		});
	},
);

/** Keyboard sync stays on main lines or on background lines, whichever it started on. */
export const backgroundSyncLanesAtom = atomWithStorage(
	"backgroundSyncLanes",
	false,
);

export type BackgroundSyncMode = "inline" | "separate" | "skip";

export const backgroundSyncModeAtom = atom(
	(get): BackgroundSyncMode => {
		if (get(bgLyricIgnoreSyncAtom)) return "skip";
		return get(backgroundSyncLanesAtom) ? "separate" : "inline";
	},
	(get, set, mode: BackgroundSyncMode) => {
		// Only rewrite lines when skipping changes, so per-line "Skip when syncing" survives.
		if (get(bgLyricIgnoreSyncAtom) !== (mode === "skip"))
			set(backgroundSyncSettingAtom, mode === "skip");
		set(backgroundSyncLanesAtom, mode === "separate");
	},
);
