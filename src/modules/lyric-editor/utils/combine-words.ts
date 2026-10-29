import { getLearnedWordParts } from "$/modules/segmentation/utils/learned-rules";
import type { LyricWord } from "$/types/ttml";

export interface CombineWordSelection {
	firstIndex: number;
	isContiguous: boolean;
	words: LyricWord[];
}

export function getCombineWordSelection(
	words: LyricWord[],
	selectedWordIds: ReadonlySet<string>,
): CombineWordSelection | null {
	const selectedIndices: number[] = [];
	const selectedWords: LyricWord[] = [];

	for (let index = 0; index < words.length; index++) {
		if (!selectedWordIds.has(words[index].id)) continue;
		selectedIndices.push(index);
		selectedWords.push(words[index]);
	}

	if (selectedWords.length < 2) return null;

	return {
		firstIndex: selectedIndices[0],
		isContiguous: selectedIndices.every(
			(index, selectionIndex) => index === selectedIndices[0] + selectionIndex,
		),
		words: selectedWords,
	};
}

function createCombinedWord(words: LyricWord[]): LyricWord {
	const combinedWord = { ...words[0] };
	combinedWord.word = words.map((word) => word.word).join("");
	combinedWord.romanWord = words.map((word) => word.romanWord).join("");
	combinedWord.romanWarning =
		words.some((word) => word.romanWarning) || undefined;
	combinedWord.obscene = words.some((word) => word.obscene);
	combinedWord.splitGroupId = words[0].splitGroupId ?? words[0].id;
	combinedWord.startTime = words[0].startTime;
	combinedWord.endTime = words[words.length - 1].endTime;
	return combinedWord;
}

export function combineSelectedWords(
	words: LyricWord[],
	selectedWordIds: ReadonlySet<string>,
): LyricWord[] {
	const selection = getCombineWordSelection(words, selectedWordIds);
	if (!selection?.isContiguous) return words;

	const remainingWords = words.filter((word) => !selectedWordIds.has(word.id));
	remainingWords.splice(
		selection.firstIndex,
		0,
		createCombinedWord(selection.words),
	);
	return remainingWords;
}

function tokenMatches(
	candidate: LyricWord,
	target: LyricWord,
	ignoreCase: boolean,
): boolean {
	if (!ignoreCase) return candidate.word === target.word;

	const candidateParts = getLearnedWordParts(candidate.word);
	const targetParts = getLearnedWordParts(target.word);
	if (!candidateParts || !targetParts) return candidate.word === target.word;
	return candidateParts.key === targetParts.key;
}

/** Combines left-to-right, non-overlapping matches within one lyric line. */
export function combineMatchingWordSequences(
	words: LyricWord[],
	targetWords: LyricWord[],
	ignoreCase: boolean,
): LyricWord[] {
	if (targetWords.length < 2 || words.length < targetWords.length) return words;

	const result: LyricWord[] = [];
	let matched = false;
	for (let index = 0; index < words.length; ) {
		const isMatch = targetWords.every((targetWord, offset) => {
			const candidate = words[index + offset];
			return candidate
				? tokenMatches(candidate, targetWord, ignoreCase)
				: false;
		});

		if (isMatch) {
			matched = true;
			result.push(
				createCombinedWord(words.slice(index, index + targetWords.length)),
			);
			index += targetWords.length;
		} else {
			result.push(words[index]);
			index++;
		}
	}

	return matched ? result : words;
}
