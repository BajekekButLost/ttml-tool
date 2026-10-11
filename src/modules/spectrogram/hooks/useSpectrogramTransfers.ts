import { produce } from "immer";
import type { useStore } from "jotai";
import { currentTimeAtom } from "$/modules/audio/states/index.ts";
import { cmdDuplicatePaste } from "$/modules/keyboard/commands.ts";
import { useCommand } from "$/modules/keyboard/hooks.ts";
import { draggingIdAtom } from "$/modules/lyric-editor/components/lyric-line-view-states.ts";
import { spectrogramSelectionAtom } from "$/modules/spectrogram/states";
import {
	copyLinesAtTime,
	copyLinesIntoRange,
} from "$/modules/spectrogram/utils/duplicate-paste";
import { lyricLinesAtom, selectedLinesAtom } from "$/states/main.ts";

export function useSpectrogramTransfers(
	globalEnableInsert: boolean,
	store: ReturnType<typeof useStore>,
) {
	useCommand(cmdDuplicatePaste, () => {
		if (!globalEnableInsert) return;

		const currentSelectedLines = store.get(selectedLinesAtom);
		if (currentSelectedLines.size === 0) return;

		const state = store.get(lyricLinesAtom);
		const linesToCopy = state.lyricLines.filter((l) =>
			currentSelectedLines.has(l.id),
		);
		if (linesToCopy.length === 0) return;

		const selection = store.get(spectrogramSelectionAtom);
		const currentTimeMs = store.get(currentTimeAtom);

		const newLines = selection
			? copyLinesIntoRange(linesToCopy, selection.start, selection.end)
			: copyLinesAtTime(linesToCopy, currentTimeMs);

		store.set(
			lyricLinesAtom,
			produce((draft) => {
				const anchorTime = selection ? selection.start : currentTimeMs;
				// Find insertion point to keep sorted
				let insertIndex = draft.lyricLines.findIndex(
					(l) => l.startTime > anchorTime,
				);
				if (insertIndex === -1) insertIndex = draft.lyricLines.length;

				draft.lyricLines.splice(insertIndex, 0, ...newLines);
			}),
		);

		// Clear selection after applying timestamps to make it "apply" and finish
		if (selection) {
			store.set(spectrogramSelectionAtom, null);
		}
	}, [globalEnableInsert, store]);

	return {
		handleDragOver: (e: React.DragEvent<HTMLDivElement>) => {
			const draggingId = store.get(draggingIdAtom);
			if (draggingId && store.get(spectrogramSelectionAtom)) {
				e.preventDefault();
				e.dataTransfer.dropEffect = "move";
			}
		},
		handleDrop: (e: React.DragEvent<HTMLDivElement>) => {
			const draggingId = store.get(draggingIdAtom);
			const selection = store.get(spectrogramSelectionAtom);
			if (draggingId && selection) {
				e.preventDefault();
				store.set(
					lyricLinesAtom,
					produce((draft) => {
						const line = draft.lyricLines.find((l) => l.id === draggingId);
						if (!line) return;
						line.startTime = Math.round(selection.start);
						line.endTime = Math.round(selection.end);
						let totalChars = 0;
						for (const word of line.words) {
							totalChars += word.word.length;
						}
						if (totalChars > 0) {
							const durationMs = line.endTime - line.startTime;
							let currentWordTime = line.startTime;
							for (const word of line.words) {
								const wordDuration = Math.round(
									(word.word.length / totalChars) * durationMs,
								);
								word.startTime = currentWordTime;
								word.endTime = currentWordTime + wordDuration;
								currentWordTime += wordDuration;
								if (word.ruby && word.ruby.length > 0) {
									let totalRubyChars = 0;
									for (const ruby of word.ruby)
										totalRubyChars += ruby.word.length;
									let currentRubyTime = word.startTime;
									for (const ruby of word.ruby) {
										const rubyDur =
											totalRubyChars > 0
												? Math.round(
														(ruby.word.length / totalRubyChars) * wordDuration,
													)
												: 0;
										ruby.startTime = currentRubyTime;
										ruby.endTime = currentRubyTime + rubyDur;
										currentRubyTime += rubyDur;
									}
								}
							}
							if (line.words.length > 0) {
								const lastWord = line.words[line.words.length - 1];
								lastWord.endTime = line.endTime;
								if (lastWord.ruby && lastWord.ruby.length > 0) {
									lastWord.ruby[lastWord.ruby.length - 1].endTime =
										line.endTime;
								}
							}
						}
					}),
				);
				store.set(spectrogramSelectionAtom, null);
			}
		},
	};
}
