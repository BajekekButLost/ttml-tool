import classNames from "classnames";
import { useAtomValue } from "jotai";
import { memo } from "react";
import {
	showRomanLinesAtom,
	showTranslationLinesAtom,
} from "$/modules/settings/states/preview";
import styles from "./index.module.css";
import type { LineGroup } from "./line-groups";

import { ActiveWord, StaticWord } from "./Words";
export const StaticLineGroup = memo(
	({ group, isPast }: { group: LineGroup; isPast: boolean }) => (
		<div
			className={classNames(
				styles.lineGroup,
				isPast && styles.lineGroupPast,
				group.main.isDuet && styles.lineGroupDuet,
			)}
		>
			{/* Main / duet line */}
			<div
				className={classNames(
					styles.line,
					group.main.isDuet && styles.lineDuetR,
				)}
			>
				<div className={styles.wordsContainer}>
					{group.main.words.map((w) => (
						<StaticWord key={w.id} word={w} />
					))}
				</div>
			</div>
			{/* BG lines */}
			{group.bg.map((bgLine, i) => (
				<div
					key={bgLine.id || i}
					className={classNames(
						styles.line,
						styles.lineBG,
						bgLine.isDuet && styles.lineDuetR,
					)}
				>
					<div className={styles.wordsContainer}>
						{bgLine.words.map((w, wi) => (
							<StaticWord key={w.id || wi} word={w} />
						))}
					</div>
				</div>
			))}
		</div>
	),
);

export const ActiveLineGroup = memo(
	({
		group,
		onWordClick,
	}: {
		group: LineGroup;
		onWordClick: (t: number) => void;
	}) => {
		const showTranslation = useAtomValue(showTranslationLinesAtom);
		const showRoman = useAtomValue(showRomanLinesAtom);
		return (
			<div
				className={classNames(
					styles.lineGroup,
					styles.lineGroupActive,
					group.main.isDuet && styles.lineGroupDuet,
				)}
			>
				{/* Main / duet line */}
				<div
					className={classNames(
						styles.line,
						styles.lineActive,
						group.main.isDuet && styles.lineDuetR,
					)}
				>
					<div className={styles.wordsContainer}>
						{group.main.words.map((w, i) => (
							<ActiveWord key={w.id || i} word={w} onWordClick={onWordClick} />
						))}
					</div>
					{showTranslation && group.main.translatedLyric && (
						<span className={styles.extraLine}>
							{group.main.translatedLyric}
						</span>
					)}
					{showRoman && group.main.romanLyric && (
						<span className={styles.extraLine}>{group.main.romanLyric}</span>
					)}
				</div>
				{/* BG lines - also highlight when group is active */}
				{group.bg.map((bgLine, i) => (
					<div
						key={bgLine.id || i}
						className={classNames(
							styles.line,
							styles.lineBG,
							styles.lineBGActive,
							bgLine.isDuet && styles.lineDuetR,
						)}
					>
						<div className={styles.wordsContainer}>
							{bgLine.words.map((w, wi) => (
								<ActiveWord
									key={w.id || wi}
									word={w}
									onWordClick={onWordClick}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		);
	},
);
