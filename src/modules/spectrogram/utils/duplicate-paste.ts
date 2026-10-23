import { sectionIdAt } from "$/modules/lyric-editor/utils/section-system.ts";
import { type LyricLine, newLyricLine, newLyricWord } from "$/types/ttml.ts";

/**
 * Copies lines into a spectrogram selection: the range is split evenly between
 * the lines, each line's non-blank words split its share evenly.
 */
export function copyLinesIntoRange(
	linesToCopy: readonly LyricLine[],
	rangeStart: number,
	rangeEnd: number,
): LyricLine[] {
	const lineDuration = (rangeEnd - rangeStart) / linesToCopy.length;

	return linesToCopy.map((l, i) => {
		const lineStart = Math.round(rangeStart + i * lineDuration);
		const lineEnd = Math.round(rangeStart + (i + 1) * lineDuration);
		const duration = lineEnd - lineStart;

		const nl = {
			...l,
			id: newLyricLine().id,
			startTime: lineStart,
			endTime: lineEnd,
			words: l.words.map((w) => ({
				...w,
				id: newLyricWord().id,
				startTime: 0,
				endTime: 0,
			})),
		};

		// Distribute words
		const nonEmptyWords = nl.words.filter((w) => w.word.trim() !== "");
		if (nonEmptyWords.length > 0) {
			const perWordDur = duration / nonEmptyWords.length;
			let wordIdx = 0;
			for (const w of nl.words) {
				if (w.word.trim() !== "") {
					w.startTime = Math.round(lineStart + wordIdx * perWordDur);
					w.endTime = Math.round(lineStart + (wordIdx + 1) * perWordDur);
					wordIdx++;
				} else {
					w.startTime = lineStart;
					w.endTime = lineStart;
				}
			}
			// Fix rounding issues for the last word
			const lastNonEmpty = nl.words
				.slice()
				.reverse()
				.find((w) => w.word.trim() !== "");
			if (lastNonEmpty) lastNonEmpty.endTime = lineEnd;
		}

		return nl;
	});
}

/** Copies lines so the earliest one starts at `timeMs`, keeping relative timing. */
export function copyLinesAtTime(
	linesToCopy: readonly LyricLine[],
	timeMs: number,
): LyricLine[] {
	const minStart = Math.min(...linesToCopy.map((l) => l.startTime));
	const offset = timeMs - minStart;

	return linesToCopy.map((l) => ({
		...l,
		id: newLyricLine().id,
		startTime: l.startTime + offset,
		endTime: l.endTime + offset,
		words: l.words.map((w) => ({
			...w,
			id: newLyricWord().id,
			startTime: w.startTime + offset,
			endTime: w.endTime + offset,
		})),
	}));
}

/**
 * Copies the selected lines to a target and inserts the copies in time order.
 * With a range, the copies fill it ({@link copyLinesIntoRange}); otherwise the
 * earliest copy starts at `target.start` ({@link copyLinesAtTime}).
 * Mutates `lyricLines` (an Immer draft is fine) and returns how many lines it
 * inserted.
 */
export function insertDuplicatedLines(
	lyricLines: LyricLine[],
	selectedLineIds: ReadonlySet<string>,
	target: { start: number; end?: number },
): number {
	const linesToCopy = lyricLines.filter((l) => selectedLineIds.has(l.id));
	if (linesToCopy.length === 0) return 0;

	const newLines =
		target.end === undefined
			? copyLinesAtTime(linesToCopy, target.start)
			: copyLinesIntoRange(linesToCopy, target.start, target.end);

	let insertIndex = lyricLines.findIndex((l) => l.startTime > target.start);
	if (insertIndex === -1) insertIndex = lyricLines.length;
	// Copies landing inside a section join it. Elsewhere they keep their
	// original's section, and repairSectionIntegrity turns that into a repeat.
	const sectionId = sectionIdAt(lyricLines, insertIndex);
	if (sectionId) {
		for (const line of newLines) {
			line.sectionId = sectionId;
			line.geniusHeader = lyricLines[insertIndex].geniusHeader;
		}
	}
	lyricLines.splice(insertIndex, 0, ...newLines);
	return newLines.length;
}
