import classNames from "classnames";
import { useAtomValue } from "jotai";
import { type CSSProperties, memo, useEffect, useRef } from "react";
import { lyricWordFadeWidthAtom } from "$/modules/settings/states/preview";
import type { LyricWord } from "$/types/ttml";
import styles from "./index.module.css";

import { displayTimeAtom, wordRegistry } from "./word-registry";
// A single word span - static version (no time subscription)
export const StaticWord = memo(({ word }: { word: LyricWord }) => (
	<span className={styles.wordStatic}>{word.word}</span>
));

// A single word span - active version (subscribes to time at a lower frequency)
export const ActiveWord = memo(
	({
		word,
		onWordClick,
	}: {
		word: LyricWord;
		onWordClick: (t: number) => void;
	}) => {
		const currentTime = useAtomValue(displayTimeAtom);
		const spanRef = useRef<HTMLSpanElement>(null);

		const isWordActive =
			currentTime >= word.startTime && currentTime <= word.endTime;
		const isWordPast = currentTime > word.endTime;
		const fadeWidth = useAtomValue(lyricWordFadeWidthAtom);

		// Register the element for high-frequency direct DOM updates
		useEffect(() => {
			if (isWordActive && spanRef.current) {
				wordRegistry.set(word.id || `${word.startTime}`, {
					el: spanRef.current,
					word,
				});
				return () => {
					wordRegistry.delete(word.id || `${word.startTime}`);
				};
			}
		}, [isWordActive, word]);

		// Initial progress for the first render or when state changes
		const progress = isWordActive
			? Math.min(
					Math.max(
						(currentTime - word.startTime) / (word.endTime - word.startTime),
						0,
					),
					1,
				)
			: isWordPast
				? 1
				: 0;
		const progressPercent = (progress * 100).toFixed(2);
		const wordStyle: CSSProperties &
			Record<"--progress" | "--fade-width", string> = {
			"--progress": `${progressPercent}%`,
			"--fade-width": `${(fadeWidth * 20).toFixed(2)}px`, // Scale for visibility
		};

		return (
			<span
				ref={spanRef}
				className={classNames(
					styles.word,
					isWordActive && styles.wordActive,
					isWordPast && styles.wordPast,
				)}
				data-active={isWordActive}
				style={wordStyle}
				onClick={(e) => {
					e.stopPropagation();
					onWordClick(word.startTime);
				}}
			>
				{word.word}
			</span>
		);
	},
);
