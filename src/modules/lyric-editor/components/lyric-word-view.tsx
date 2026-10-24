/*
 * Copyright 2023-2026 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/spicylyrics/ttml-tool/blob/main/LICENSE
 */

import { type Atom, useAtomValue } from "jotai";
import { type FC, memo } from "react";
import { ToolMode, toolModeAtom } from "$/states/main.ts";
import type { LyricLine, LyricWord } from "$/types/ttml.ts";
import styles from "./index.module.css";
import { LyricWordViewEdit } from "./lyric-word-view/LyricWordViewEdit";
import { LyricWordViewSync } from "./lyric-word-view/LyricWordViewSync";
import { useWordBlank } from "./lyric-word-view/use-word-blank";

type LyricWordViewProps = {
	wordAtom: Atom<LyricWord>;
	wordIndex: number;
	line: LyricLine;
	lineIndex: number;
};

export const LyricWordView: FC<
	LyricWordViewProps & { isHeaderLine?: boolean }
> = memo(
	({ wordAtom, wordIndex, line, lineIndex, isHeaderLine }) => {
		const word = useAtomValue(wordAtom);
		const toolMode = useAtomValue(toolModeAtom);

		const isWordBlank = useWordBlank(word.word);

		if (isHeaderLine) {
			return (
				<div className={styles.wordMainText} style={{ padding: "8px 0" }}>
					{word.word}
				</div>
			);
		}

		return (
			<div>
				{toolMode === ToolMode.Edit && (
					<LyricWordViewEdit
						wordAtom={wordAtom}
						line={line}
						lineIndex={lineIndex}
						wordIndex={wordIndex}
					/>
				)}
				{toolMode === ToolMode.Sync && !isWordBlank && (
					<LyricWordViewSync
						wordAtom={wordAtom}
						line={line}
						lineIndex={lineIndex}
						wordIndex={wordIndex}
					/>
				)}
			</div>
		);
	},
	// Custom comparator: line.id is stable (never changes after creation).
	// Checking it instead of the full line object prevents all word views in a
	// line from re-rendering when a single word's timestamp is committed.
	// The wordAtom reference changes (via splitAtom) only for the modified word,
	// so only that word re-renders.
	(prev, next) =>
		prev.wordAtom === next.wordAtom &&
		prev.wordIndex === next.wordIndex &&
		prev.lineIndex === next.lineIndex &&
		prev.line.id === next.line.id &&
		prev.isHeaderLine === next.isHeaderLine,
);

export default LyricWordView;
