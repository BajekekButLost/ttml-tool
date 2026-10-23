import { atomWithStorage } from "jotai/utils";
import type { SyncLane } from "$/modules/lyric-editor/utils/lyric-states";

/** Which lines G, H and word navigation may move to. */
export const backgroundSyncLaneAtom = atomWithStorage<SyncLane>(
	"backgroundSyncLane",
	"all",
);
