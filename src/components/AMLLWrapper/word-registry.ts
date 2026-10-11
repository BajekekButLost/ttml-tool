import { atom } from "jotai";
import type { LyricWord } from "$/types/ttml";
export const displayTimeAtom = atom(0);

/**
 * A registry to hold references to active word DOM elements.
 * This allows us to update the --progress CSS variable directly at high frequency
 * without triggering React re-renders.
 */
export const wordRegistry = new Map<
	string,
	{ el: HTMLSpanElement; word: LyricWord }
>();
