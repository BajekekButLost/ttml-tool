/*
 * Copyright 2023-2025 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/NaeNaeTart/NaeNae-AMLL-TTML-TOOL/blob/main/LICENSE
 */

import { Button } from "@radix-ui/themes";
import { selectedLinesAtom } from "$/states/main.ts";
import { newLyricLine } from "$/types/ttml.ts";
import {
	duplicateLinesWithSections,
	insertLinesInSection,
	sectionIdAt,
} from "../../utils/section-system.ts";
import type { LyricLineViewState } from "./use-line-view";

export function LineTrailingInsert({
	lineIndex,
	t,
	editLyricLines,
	store,
	isLastLine,
	selectedLinesCount,
	enableInsertLocal,
	globalEnableInsert,
	disableInsert,
}: Pick<
	LyricLineViewState,
	| "lineIndex"
	| "t"
	| "editLyricLines"
	| "store"
	| "isLastLine"
	| "selectedLinesCount"
	| "enableInsertLocal"
	| "globalEnableInsert"
	| "disableInsert"
>) {
	return (
		(enableInsertLocal || (globalEnableInsert && isLastLine)) && (
			<Button
				mx="1"
				my="1"
				variant="soft"
				size="1"
				style={{
					width: "calc(100% - var(--space-4))",
				}}
				onClick={(evt) => {
					editLyricLines((state) => {
						const selectedLines = store.get(selectedLinesAtom);
						if (selectedLines.size > 0) {
							const sectionId = sectionIdAt(state.lyricLines, lineIndex + 1);
							const newLines = duplicateLinesWithSections(
								state,
								selectedLines,
								sectionId,
							);
							insertLinesInSection(state, lineIndex + 1, newLines, sectionId);
						} else {
							// A new line added after this one belongs to this line's section.
							insertLinesInSection(
								state,
								lineIndex + 1,
								[newLyricLine()],
								state.lyricLines[lineIndex]?.sectionId,
							);
						}
					});
					// setInsertMode(InsertMode.None);
					if (!evt.shiftKey) {
						disableInsert();
					}
				}}
			>
				{selectedLinesCount > 0
					? t("lyricLineView.duplicateLinesHere", {
							count: selectedLinesCount,
							defaultValue:
								"{count, plural, one {Duplicate the selected line here} other {Duplicate # selected lines here}}",
						})
					: t("lyricLineView.insertLine", "在此插入新行")}
			</Button>
		)
	);
}
