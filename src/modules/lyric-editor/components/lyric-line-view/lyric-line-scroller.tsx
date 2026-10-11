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

import { type Atom, atom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { selectedWordsAtom, toolModeAtom } from "$/states/main.ts";
import type { LyricLine } from "$/types/ttml.ts";
import { shouldAutoCenterSelection } from "../selection-scroll";

export const LyricLineScroller = ({
	lineAtom,
	wordsContainer,
	editingRomanWordIndex,
}: {
	lineAtom: Atom<LyricLine>;
	wordsContainer: HTMLDivElement | null;
	editingRomanWordIndex: number | null;
}) => {
	const toolMode = useAtomValue(toolModeAtom);
	const scrollToIndexAtom = useMemo(
		() =>
			atom((get) => {
				if (!shouldAutoCenterSelection(toolMode)) return Number.NaN;
				const line = get(lineAtom);
				const selectedWords = get(selectedWordsAtom);
				if (selectedWords.size === 0) return Number.NaN;
				let scrollToIndex = Number.NaN;
				let i = 0;
				for (const word of line.words) {
					if (selectedWords.has(word.id)) {
						scrollToIndex = i;
						break;
					}
					i++;
				}
				return scrollToIndex;
			}),
		[lineAtom, toolMode],
	);
	const scrollToIndex = useAtomValue(scrollToIndexAtom);

	useEffect(() => {
		const targetIndex = !Number.isNaN(scrollToIndex)
			? scrollToIndex
			: editingRomanWordIndex;
		if (targetIndex === null || Number.isNaN(targetIndex)) return;
		// console.log({ scrollToIndex, wordsContainer });
		if (!wordsContainer) return;
		const wordEl = wordsContainer.children[targetIndex] as HTMLElement;
		// console.log({ wordEl, wordsContainer });
		if (!wordEl) return;
		wordsContainer.scrollTo({
			left: wordEl.offsetLeft - wordsContainer.clientWidth / 2,
			behavior: "auto",
		});
	}, [scrollToIndex, editingRomanWordIndex, wordsContainer]);

	useEffect(() => {
		if (!wordsContainer) return;
		const handleFocusIn = (evt: FocusEvent) => {
			const target = evt.target as HTMLElement | null;
			if (!target) return;
			const wordGroup = target.closest<HTMLElement>("[data-word-index]");
			if (!wordGroup || !wordsContainer.contains(wordGroup)) return;
			wordsContainer.scrollTo({
				left: wordGroup.offsetLeft - wordsContainer.clientWidth / 2,
				behavior: "auto",
			});
		};
		wordsContainer.addEventListener("focusin", handleFocusIn);
		return () => {
			wordsContainer.removeEventListener("focusin", handleFocusIn);
		};
	}, [wordsContainer]);

	return null;
};
