import { atomWithStorage } from "jotai/utils";
import type { HintId } from "./detectors";

/** The "Show tips" setting; "Don't show tips" on a tip turns it off. */
export const didYouKnowEnabledAtom = atomWithStorage(
	"didYouKnowHintsEnabled",
	true,
	undefined,
	{ getOnInit: true },
);

/** Hints that have already shown once; they never show again. */
export const didYouKnowShownAtom = atomWithStorage<HintId[]>(
	"didYouKnowShownHints",
	[],
	undefined,
	{ getOnInit: true },
);
