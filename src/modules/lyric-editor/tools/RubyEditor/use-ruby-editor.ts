import { type Atom, useAtomValue, useStore } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import { useCallback, useRef, useState } from "react";
import { recalculateWordTime } from "$/modules/segmentation/utils/segmentation.ts";
import { useSegmentationConfig } from "$/modules/segmentation/utils/useSegmentationConfig.ts";
import {
	lyricLinesAtom,
	projectIdAtom,
	rubyWarningShownProjectIdsAtom,
} from "$/states/main.ts";
import type { LyricWord } from "$/types/ttml.ts";

export const useRubyEditor = (wordAtom: Atom<LyricWord>) => {
	const word = useAtomValue(wordAtom);
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);
	const store = useStore();
	const rubyWords = word.ruby ?? [];
	const { config: segmentationConfig } = useSegmentationConfig();
	const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
	const [warningOpen, setWarningOpen] = useState(false);
	const projectId = useAtomValue(projectIdAtom);

	const addRubyWord = useCallback(() => {
		const shownProjectIds = store.get(rubyWarningShownProjectIdsAtom);
		if (!shownProjectIds.has(projectId)) {
			const lyricState = store.get(lyricLinesAtom);
			const hasRuby = lyricState.lyricLines.some((line) =>
				line.words.some((word) => (word.ruby?.length ?? 0) > 0),
			);
			const nextShown = new Set(shownProjectIds);
			nextShown.add(projectId);
			store.set(rubyWarningShownProjectIdsAtom, nextShown);
			if (!hasRuby) {
				setWarningOpen(true);
			}
		}
		const currentWord = store.get(wordAtom);
		const nextIndex = currentWord.ruby?.length ?? 0;
		editLyricLines((state) => {
			for (const line of state.lyricLines) {
				for (const word of line.words) {
					if (word.id !== currentWord.id) continue;
					if (!word.ruby) word.ruby = [];
					word.ruby.push({
						word: "",
						startTime: word.startTime,
						endTime: word.endTime,
					});
					break;
				}
			}
		});
		requestAnimationFrame(() => {
			inputRefs.current[nextIndex]?.focus();
		});
	}, [editLyricLines, projectId, store, wordAtom]);

	const updateRubyWord = useCallback(
		(index: number, value: string) => {
			const currentWord = store.get(wordAtom);
			editLyricLines((state) => {
				for (const line of state.lyricLines) {
					for (const word of line.words) {
						if (word.id !== currentWord.id) continue;
						if (!word.ruby || !word.ruby[index]) return;
						word.ruby[index].word = value;
						break;
					}
				}
			});
		},
		[editLyricLines, store, wordAtom],
	);

	const removeRubyWord = useCallback(
		(index: number) => {
			const currentWord = store.get(wordAtom);
			editLyricLines((state) => {
				for (const line of state.lyricLines) {
					for (const word of line.words) {
						if (word.id !== currentWord.id) continue;
						if (!word.ruby || !word.ruby[index]) return;
						word.ruby.splice(index, 1);
						break;
					}
				}
			});
		},
		[editLyricLines, store, wordAtom],
	);

	const mergeRubyWithPrevious = useCallback(
		(index: number) => {
			const currentWord = store.get(wordAtom);
			const prevText = currentWord.ruby?.[index - 1]?.word ?? "";
			const currentText = currentWord.ruby?.[index]?.word ?? "";
			const mergedText = `${prevText}${currentText}`;

			editLyricLines((state) => {
				for (const line of state.lyricLines) {
					for (const word of line.words) {
						if (word.id !== currentWord.id) continue;
						if (!word.ruby || !word.ruby[index] || !word.ruby[index - 1])
							return;
						const prevRuby = word.ruby[index - 1];
						const currentRuby = word.ruby[index];
						prevRuby.word = mergedText;
						prevRuby.startTime = Math.min(
							prevRuby.startTime,
							currentRuby.startTime,
						);
						prevRuby.endTime = Math.max(prevRuby.endTime, currentRuby.endTime);
						word.ruby.splice(index, 1);
						break;
					}
				}
			});

			requestAnimationFrame(() => {
				const target = inputRefs.current[index - 1];
				if (target) {
					target.focus();
					target.setSelectionRange(mergedText.length, mergedText.length);
				}
			});
		},
		[editLyricLines, store, wordAtom],
	);

	const applyRubyToAllSameWords = useCallback(() => {
		const currentWord = store.get(wordAtom);
		const rubySegments = currentWord.ruby?.map((ruby) => ruby.word) ?? [];
		if (rubySegments.length === 0) return;

		editLyricLines((state) => {
			for (const line of state.lyricLines) {
				for (const word of line.words) {
					if (word.word !== currentWord.word) continue;
					const recalculated = recalculateWordTime(
						word,
						rubySegments,
						segmentationConfig,
					);
					word.ruby = recalculated.map((segment) => ({
						word: segment.word,
						startTime: segment.startTime,
						endTime: segment.endTime,
					}));
				}
			}
		});
	}, [editLyricLines, segmentationConfig, store, wordAtom]);

	return {
		word,
		rubyWords,
		inputRefs,
		warningOpen,
		setWarningOpen,
		addRubyWord,
		updateRubyWord,
		removeRubyWord,
		mergeRubyWithPrevious,
		applyRubyToAllSameWords,
	};
};
