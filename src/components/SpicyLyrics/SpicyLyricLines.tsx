/*
 * Adapted from the Spicy Lyrics renderer (AGPL-3.0-or-later).
 * Original project: https://github.com/Spikerko/Spicy-Lyrics
 */
import classNames from "classnames";
import type { RefObject } from "react";
import styles from "./index.module.css";
import {
	groupSpicyTokens,
	isRtl,
	keyFor,
	type SpicyLine,
	type SpicyToken,
} from "./model";

export function SpicyLyricLines({
	lines,
	lineNodes,
	wordNodes,
	showTranslation,
	seek,
}: {
	lines: SpicyLine[];
	lineNodes: RefObject<Map<string, HTMLDivElement>>;
	wordNodes: RefObject<Map<string, HTMLElement>>;
	showTranslation: boolean;
	seek: (time: number) => void;
}) {
	const renderToken = (
		line: SpicyLine,
		word: SpicyToken,
		wordIndex: number,
		wordBoundary: boolean,
	) => {
		const key = keyFor(line, word, wordIndex);
		const letters = word.letters;
		const className = letters ? styles.letterGroup : styles.word;
		return (
			<span
				key={key}
				ref={(node) => {
					if (node) wordNodes.current.set(key, node);
					else wordNodes.current.delete(key);
				}}
				className={classNames(
					className,
					wordBoundary && styles.wordBoundary,
					word.allowInternalWrap && styles.breakableToken,
				)}
				dir={isRtl(word.text) ? "rtl" : undefined}
			>
				{letters
					? letters
							.map((letter, index) => ({
								letter,
								start:
									word.startTime +
									index * ((word.endTime - word.startTime) / letters.length),
							}))
							.map(({ letter, start }) => (
								<span
									key={`${key}:${start}`}
									ref={(node) => {
										if (node) wordNodes.current.set(`${key}:${start}`, node);
										else wordNodes.current.delete(`${key}:${start}`);
									}}
									className={styles.letter}
								>
									{letter}
								</span>
							))
					: word.text}
			</span>
		);
	};
	return (
		<>
			{lines.map((line) => (
				<div
					key={line.id}
					ref={(node) => {
						if (node) lineNodes.current.set(line.id, node);
						else lineNodes.current.delete(line.id);
					}}
					className={classNames(
						styles.line,
						line.isDotLine && styles.dotLine,
						line.isLineSynced && styles.lineSynced,
						line.isRtl && styles.rtl,
						line.isBackground && styles.backgroundLine,
						line.isDuet && styles.duet,
					)}
					dir={line.isRtl ? "rtl" : undefined}
					onClick={() => seek(line.startTime)}
				>
					{line.isDotLine ? (
						<div className={styles.dotGroup}>
							{line.words.map((word, wi) => {
								const key = keyFor(line, word, wi);
								return (
									<span
										key={key}
										ref={(node) => {
											if (node) wordNodes.current.set(key, node);
											else wordNodes.current.delete(key);
										}}
										className={styles.dot}
									>
										{word.text}
									</span>
								);
							})}
						</div>
					) : line.isLineSynced ? (
						line.text
					) : (
						groupSpicyTokens(line.words).map((group) => {
							const first = group.items[0];
							if (group.items.length === 1)
								return renderToken(
									line,
									first.token,
									first.wordIndex,
									group.hasTrailingSpace,
								);
							return (
								<span
									key={`group:${keyFor(line, first.token, first.wordIndex)}`}
									className={classNames(
										styles.wordGroup,
										group.hasTrailingSpace && styles.wordBoundary,
									)}
								>
									{group.items.map(({ token, wordIndex }) =>
										renderToken(line, token, wordIndex, false),
									)}
								</span>
							);
						})
					)}
					{showTranslation && !line.isDotLine && line.translation ? (
						<span className={styles.translation}>{line.translation}</span>
					) : null}
				</div>
			))}
		</>
	);
}
