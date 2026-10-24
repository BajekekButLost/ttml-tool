/*
 * Copyright 2023-2025 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/spicylyrics/ttml-tool/blob/main/LICENSE
 */

import { Button, Flex, Text } from "@radix-ui/themes";
import { toast } from "react-toastify";
import { currentTimeAtom } from "$/modules/audio/states/index.ts";
import { lyricLinesAtom, ToolMode } from "$/states/main.ts";
import {
	copySectionTimings,
	findPreviousMatchingSection,
	shiftSectionToTime,
} from "../../utils/genius-sections.ts";
import { SectionActions } from "../SectionActions.tsx";
import type { LyricLineViewState } from "./use-line-view";

export function LineSectionHeader({
	lineIndex,
	t,
	toolMode,
	editLyricLines,
	store,
	activeSection,
	sectionActionsEnabled,
	activeGeniusHeader,
	customHeaderColor,
	isSectionStart,
	categoryColor,
}: Pick<
	LyricLineViewState,
	| "lineIndex"
	| "t"
	| "toolMode"
	| "editLyricLines"
	| "store"
	| "activeSection"
	| "sectionActionsEnabled"
	| "activeGeniusHeader"
	| "customHeaderColor"
	| "isSectionStart"
	| "categoryColor"
>) {
	return (
		isSectionStart && (
			<Flex gap="2" mb="1" align="center">
				<Text
					size="1"
					weight="bold"
					color={
						customHeaderColor || categoryColor === "accent"
							? undefined
							: categoryColor
					}
					style={{
						opacity: 0.8,
						textTransform: "uppercase",
						color: customHeaderColor || undefined,
					}}
				>
					{activeGeniusHeader}
				</Text>
				{sectionActionsEnabled && activeSection && (
					<SectionActions section={activeSection} />
				)}
				{toolMode === ToolMode.Sync && (
					<Button
						size="1"
						variant="ghost"
						onClick={(e) => {
							e.stopPropagation();
							const currentTime = store.get(currentTimeAtom);
							editLyricLines((state) => {
								shiftSectionToTime(state.lyricLines, lineIndex, currentTime);
							});
						}}
					>
						{t(
							"experimentalFeatures.geniusCategorization.snapToPlayhead",
							"Snap to playhead",
						)}
					</Button>
				)}
				{toolMode === ToolMode.Sync && (
					<Button
						size="1"
						variant="ghost"
						onClick={(e) => {
							e.stopPropagation();
							const lyricLines = store.get(lyricLinesAtom).lyricLines;
							const previousSection = findPreviousMatchingSection(
								lyricLines,
								lineIndex,
								store.get(lyricLinesAtom).sections,
							);

							if (previousSection) {
								let copyResult: ReturnType<typeof copySectionTimings>;
								editLyricLines((state) => {
									copyResult = copySectionTimings(
										state.lyricLines,
										lineIndex,
										previousSection,
									);
								});
								if (!copyResult?.copiedLineCount) {
									toast.info(
										t(
											"experimentalFeatures.geniusCategorization.noMatchingLines",
											"No lines in this section match the earlier one, so nothing was copied.",
										),
									);
									return;
								}
								toast.success(t("common.success", "Restored"));
								if (!copyResult.lengthsMatch) {
									toast.info(
										"Section lengths differ; copied matching lines only.",
									);
								}
							} else {
								toast.info(
									t(
										"experimentalFeatures.geniusCategorization.noPreviousFound",
										"No earlier matching section with timing found.",
									),
								);
							}
						}}
					>
						{t(
							"experimentalFeatures.geniusCategorization.copyPrevious",
							"Copy previous timing",
						)}
					</Button>
				)}
			</Flex>
		)
	);
}
