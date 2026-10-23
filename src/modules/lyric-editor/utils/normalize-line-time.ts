import type { LyricLine, LyricWord } from "$/types/ttml";

const isTimedText = (word: LyricWord) =>
	word.word.trim() !== "" && (word.startTime > 0 || word.endTime > 0);

/**
 * Re-derives a line's start and end from its first and last timed words.
 * Blank and untimed words are skipped, so deleting the last sung word pulls
 * the line end back even when a trailing space is left behind. A line with
 * no timed words keeps its bounds.
 */
export function normalizeLineTime(line: LyricLine) {
	const first = line.words.find(isTimedText);
	let last: LyricWord | undefined;
	for (let i = line.words.length - 1; i >= 0 && !last; i--) {
		if (isTimedText(line.words[i])) last = line.words[i];
	}
	if (!first || !last) return;
	line.startTime = first.startTime;
	line.endTime = last.endTime || line.endTime;
}

/**
 * Removes the given words and re-derives the bounds of every line that lost a
 * word. Mutates `lines` (an Immer draft is fine).
 */
export function deleteWordsFromLines(
	lines: LyricLine[],
	wordIds: ReadonlySet<string>,
) {
	for (const line of lines) {
		const remaining = line.words.filter((w) => !wordIds.has(w.id));
		if (remaining.length === line.words.length) continue;
		line.words = remaining;
		normalizeLineTime(line);
	}
}
