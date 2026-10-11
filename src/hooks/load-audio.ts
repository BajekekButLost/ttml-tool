import type { getDefaultStore } from "jotai";
import { isSafeLinkedPath } from "$/modules/project/folder-project/manifest";
import {
	activeProjectDirAtom,
	pendingAudioFileAtom,
	pendingAudioPathAtom,
	projectAudioFileAtom,
} from "$/modules/project/folder-project/state";

import { projectIdAtom } from "$/states/main";

export function getDialogPath(file: File): string | null {
	const path = (file as File & { path?: unknown }).path;
	return isSafeLinkedPath(path) ? path : null;
}

/** Commit a decoded file only to the project that requested it. */
export async function loadAudioFile(
	store: ReturnType<typeof getDefaultStore>,
	audio: File,
	decode: (audio: File) => Promise<unknown>,
): Promise<boolean> {
	const originDir = store.get(activeProjectDirAtom);
	const originProjectId = store.get(projectIdAtom);
	await decode(audio);
	if (
		store.get(activeProjectDirAtom) !== originDir ||
		store.get(projectIdAtom) !== originProjectId
	) {
		return false;
	}
	store.set(pendingAudioFileAtom, audio);
	store.set(pendingAudioPathAtom, getDialogPath(audio));
	if (originDir) store.set(projectAudioFileAtom, audio);
	return true;
}
