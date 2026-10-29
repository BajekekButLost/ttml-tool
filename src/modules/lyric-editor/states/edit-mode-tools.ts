import { atomWithStorage } from "jotai/utils";

/**
 * Split text typed into an empty line's "Insert word" field into words, the
 * way the import splits a line. Off by default.
 */
export const splitTypedLinesAtom = atomWithStorage(
	"lyricEditor.splitTypedLines",
	false,
	undefined,
	{ getOnInit: true },
);

/** Reopen each project at the line where Edit mode was left. Off by default. */
export const editScrollMemoryAtom = atomWithStorage(
	"lyricEditor.editScrollMemory",
	false,
	undefined,
	{ getOnInit: true },
);
