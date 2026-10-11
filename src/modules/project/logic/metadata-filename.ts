import type { TTMLMetadata } from "$/types/ttml";

import { sanitizeFileName } from "./file-names";

type SuggestedTtmlFileName = {
	baseName: string;
	fileName: string;
};

const getFirstNonEmptyValue = (values?: string[]): string | null => {
	if (!values) return null;
	for (const value of values) {
		const trimmed = value.trim();
		if (trimmed) return trimmed;
	}
	return null;
};

export const getSuggestedTtmlFileName = (
	metadata: TTMLMetadata[],
	{ allowPartial = false }: { allowPartial?: boolean } = {},
): SuggestedTtmlFileName | null => {
	const musicName = getFirstNonEmptyValue(
		metadata.find((entry) => entry.key === "musicName")?.value,
	);
	const artists = getFirstNonEmptyValue(
		metadata.find((entry) => entry.key === "artists")?.value,
	);

	if ((!musicName || !artists) && !allowPartial) return null;
	if (!musicName && !artists) return null;

	const baseName = sanitizeFileName(
		[artists, musicName].filter(Boolean).join(" - "),
		120,
	);
	return {
		baseName,
		fileName: `${baseName}.ttml`,
	};
};
