import { atom } from "jotai";
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
