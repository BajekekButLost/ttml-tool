import { getSynchronizableUnits } from "$/modules/lyric-editor/utils/lyric-states";
import { validateSections } from "$/modules/lyric-editor/utils/section-system";
import type { TTMLLyric } from "$/types/ttml";
import type { LyricTextNormalizationOptions } from "$/utils/apostrophe-normalization";
import exportTTMLText, { type TTMLExportOptions } from "./ttml-writer";

/** The serializer for every user export, including folder projects. */
export function produceTTMLText(
	lyric: TTMLLyric,
	normalization?: LyricTextNormalizationOptions,
	options?: TTMLExportOptions,
): string {
	return exportTTMLText(lyric, normalization, options);
}

export function reviewTTMLExport(lyric: TTMLLyric) {
	const firstUntimedLine = lyric.lyricLines.find(
		(line) => line.endTime === 0 && getSynchronizableUnits(line).length > 0,
	);
	const line =
		firstUntimedLine ??
		lyric.lyricLines.find((candidate) =>
			getSynchronizableUnits(candidate).some(
				(unit) => (unit.rubyWord ?? unit.word).endTime === 0,
			),
		);
	const unit =
		line &&
		(firstUntimedLine
			? getSynchronizableUnits(line)[0]
			: getSynchronizableUnits(line).find(
					(unit) => (unit.rubyWord ?? unit.word).endTime === 0,
				));
	return {
		untimed: line && unit ? { line, unit } : undefined,
		sectionIssueCount: validateSections(lyric).length,
	};
}

export interface PreparedTTML {
	lyric: TTMLLyric;
	text: string;
}
