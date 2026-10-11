/*
 * Copyright 2023-2026 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/NaeNaeTart/NaeNae-AMLL-TTML-TOOL/blob/main/LICENSE
 */

import { type Atom, useAtomValue } from "jotai";
import { type FC, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { displayRomanizationInSyncAtom } from "$/modules/settings/states/index.ts";
import type { LyricLine, LyricWord } from "$/types/ttml.ts";
import { buildRubySelectionId } from "../../utils/lyric-states.ts";
import styles from "../index.module.css";
import { LyricSyncWordView } from "./LyricSyncWordView";
import { useWordBlank } from "./use-word-blank";
import { getDisplayWordText } from "./word-text";
export const LyricWordViewSync: FC<{
	wordAtom: Atom<LyricWord>;
	wordIndex: number;
	line: LyricLine;
	lineIndex: number;
}> = ({ wordAtom, line, lineIndex, wordIndex }) => {
	const { t } = useTranslation();
	const word = useAtomValue(wordAtom);
	const displayRomanizationInSync = useAtomValue(displayRomanizationInSyncAtom);
	const hasRomanization =
		displayRomanizationInSync && word.romanWord?.trim() !== "";
	const isWordBlank = useWordBlank(word.word);
	const getDisplayWord = useCallback(
		(
			displayText: string,
			isBlank: boolean,
			romanWord?: string,
			showRomanization?: boolean,
		) =>
			getDisplayWordText(t, displayText, isBlank, romanWord, showRomanization),
		[t],
	);

	const content =
		word.ruby && word.ruby.length > 0 ? (
			<div className={styles.rubySyncRow}>
				{word.ruby.map((rubyWord, rubyIndex) => {
					const isRubyBlank =
						rubyWord.word.length === 0 ||
						(rubyWord.word.length > 0 && rubyWord.word.trim().length === 0);
					return (
						<LyricSyncWordView
							key={`${word.id}-ruby-${rubyIndex}`}
							syncId={buildRubySelectionId(word.id, rubyIndex)}
							wordAtom={wordAtom}
							line={line}
							startTime={rubyWord.startTime}
							endTime={rubyWord.endTime}
							displayWord={getDisplayWord(rubyWord.word, isRubyBlank)}
							isWordBlank={isRubyBlank}
							wordIndex={wordIndex}
							lineIndex={lineIndex}
							rubyIndex={rubyIndex}
							editableField="word"
						/>
					);
				})}
			</div>
		) : (
			<LyricSyncWordView
				syncId={word.id}
				wordAtom={wordAtom}
				line={line}
				startTime={word.startTime}
				endTime={word.endTime}
				displayWord={getDisplayWord(
					word.word,
					isWordBlank,
					word.romanWord,
					displayRomanizationInSync,
				)}
				isWordBlank={isWordBlank}
				wordIndex={wordIndex}
				lineIndex={lineIndex}
				editableField={hasRomanization ? "romanWord" : "word"}
			/>
		);

	return content;
};
