import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { SyncLane } from "$/modules/lyric-editor/utils/lyric-states";
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

/** Which lines G, H and word navigation may move to. */
export const backgroundSyncLaneAtom = atomWithStorage<SyncLane>(
	"backgroundSyncLane",
	"all",
);

export type BackgroundSyncMode = "inline" | "separate" | "only" | "skip";

const laneForMode = {
	inline: "all",
	separate: "same",
	only: "background",
	skip: "all",
} as const satisfies Record<BackgroundSyncMode, SyncLane>;

export const backgroundSyncModeAtom = atom(
	(get): BackgroundSyncMode => {
		if (get(bgLyricIgnoreSyncAtom)) return "skip";
		const lane = get(backgroundSyncLaneAtom);
		if (lane === "same") return "separate";
		return lane === "background" ? "only" : "inline";
	},
	(get, set, mode: BackgroundSyncMode) => {
		// Only rewrite lines when skipping changes, so per-line "Skip when syncing" survives.
		if (get(bgLyricIgnoreSyncAtom) !== (mode === "skip"))
			set(backgroundSyncSettingAtom, mode === "skip");
		set(backgroundSyncLaneAtom, laneForMode[mode]);
	},
);
