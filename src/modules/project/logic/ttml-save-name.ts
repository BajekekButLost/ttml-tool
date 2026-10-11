import type { TTMLLyric } from "$/types/ttml";
import { ensureExtension, sanitizeFileName } from "../folder-project/manifest";
import { getSuggestedTtmlFileName } from "./metadata-filename";

/** Reuse the existing filename sanitizer; only choose the shared naming policy. */
export function getTTMLSaveName(
	lyric: TTMLLyric,
	existingName?: string,
	project?: { name: string; nameEdited?: boolean } | null,
): string {
	const documentName =
		existingName && existingName !== "lyric.ttml" ? existingName : undefined;
	const name = project?.nameEdited
		? project.name
		: documentName ||
			getSuggestedTtmlFileName(lyric.metadata)?.baseName ||
			project?.name ||
			"lyric";
	return ensureExtension(sanitizeFileName(name), "ttml");
}
