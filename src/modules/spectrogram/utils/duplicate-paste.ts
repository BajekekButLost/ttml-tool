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
