import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { FollowMode } from "../utils/follow-playhead";

export type FollowStyle = Exclude<FollowMode, "off">;

/** The toolbar toggle, its shortcut and the Preferences switch flip this. */
export const spectrogramFollowOnAtom = atomWithStorage(
	"settings_spectrogramFollowOn",
	true,
);

export const spectrogramFollowStyleAtom = atomWithStorage<FollowStyle>(
	"settings_spectrogramFollowStyle",
	"page",
);

export const spectrogramFollowModeAtom = atom<FollowMode>((get) =>
	get(spectrogramFollowOnAtom) ? get(spectrogramFollowStyleAtom) : "off",
);
