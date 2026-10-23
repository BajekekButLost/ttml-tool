import { produce } from "immer";
import type { useStore } from "jotai";
import { currentTimeAtom } from "$/modules/audio/states/index.ts";
import { cmdDuplicatePaste } from "$/modules/keyboard/commands.ts";
import { useCommand } from "$/modules/keyboard/hooks.ts";
import {
	draggingIdAtom,
	globalEnableInsertAtom,
} from "$/modules/lyric-editor/components/lyric-line-view-states.ts";
import { repairSectionIntegrity } from "$/modules/lyric-editor/utils/section-system.ts";
import { spectrogramSelectionAtom } from "$/modules/spectrogram/states";
import { insertDuplicatedLines } from "$/modules/spectrogram/utils/duplicate-paste";
import { lyricLinesAtom, selectedLinesAtom } from "$/states/main.ts";

export function useSpectrogramTransfers(store: ReturnType<typeof useStore>) {
	// Works with any line selection, not only after "Duplicate to…", so the
	// shortcut shown in the line context menu always does something.
	useCommand(cmdDuplicatePaste, () => {
		const currentSelectedLines = store.get(selectedLinesAtom);
		if (currentSelectedLines.size === 0) return;

		const selection = store.get(spectrogramSelectionAtom);
		const currentTimeMs = store.get(currentTimeAtom);

		store.set(
			lyricLinesAtom,
			produce((draft) => {
				insertDuplicatedLines(
					draft.lyricLines,
					currentSelectedLines,
					selection ?? { start: currentTimeMs },
				);
				repairSectionIntegrity(draft);
			}),
		);

		// Clear selection after applying timestamps to make it "apply" and finish
		if (selection) {
			store.set(spectrogramSelectionAtom, null);
		}
		store.set(globalEnableInsertAtom, false);
	}, [store]);

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
							}
							if (line.words.length > 0) {
								const lastWord = line.words[line.words.length - 1];
								lastWord.endTime = line.endTime;
							}
						}
					}),
				);
				store.set(spectrogramSelectionAtom, null);
			}
		},
	};
}
