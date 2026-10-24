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

import type { Draft } from "immer";
import type { useStore } from "jotai";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { lyricLinesAtom, ToolMode } from "$/states/main.ts";
import type { LyricLine, TTMLLyric } from "$/types/ttml.ts";

export function useLineTiming({
	line,
	lineIndex,
	visualizeTimestampUpdate,
	startTimeRef,
	endTimeRef,
	toolMode,
	disableInsert,
	store,
	editLyricLines,
}: {
	line: LyricLine;
	lineIndex: number;
	visualizeTimestampUpdate: boolean;
	startTimeRef: React.RefObject<HTMLDivElement | null>;
	endTimeRef: React.RefObject<HTMLButtonElement | null>;
	toolMode: ToolMode;
	disableInsert: () => void;
	store: ReturnType<typeof useStore>;
	editLyricLines: (edit: (draft: Draft<TTMLLyric>) => void) => void;
}) {
	const [endTimeLinked, setEndTimeLinked] = useState(() =>
		Boolean(line.endTimeLink),
	);
	const originalEndTimeRef = useRef<number | null>(null);
	const originalNextStartTimeRef = useRef<number | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: 用于呈现时间戳更新效果
	useEffect(() => {
		if (!visualizeTimestampUpdate) return;
		const animation = startTimeRef.current?.animate(
			[
				{
					backgroundColor: "var(--accent-a8)",
				},
				{
					backgroundColor: "var(--accent-a4)",
				},
			],
			{
				duration: 500,
			},
		);

		return () => {
			animation?.cancel();
		};
	}, [line.startTime, visualizeTimestampUpdate]);

	useLayoutEffect(() => {
		if (toolMode !== ToolMode.Edit) {
			disableInsert();
		}
	}, [toolMode, disableInsert]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: 用于呈现时间戳更新效果
	useEffect(() => {
		if (!visualizeTimestampUpdate) return;
		const animation = endTimeRef.current?.animate(
			[
				{
					backgroundColor: "var(--accent-a8)",
				},
				{
					backgroundColor: "var(--accent-a4)",
				},
			],
			{
				duration: 500,
			},
		);

		return () => {
			animation?.cancel();
		};
	}, [line.endTime, visualizeTimestampUpdate]);

	useEffect(() => {
		if (!endTimeLinked) return;
		const nextLine = store.get(lyricLinesAtom).lyricLines[lineIndex + 1];
		if (!nextLine) {
			editLyricLines((state) => {
				const targetLine = state.lyricLines[lineIndex];
				if (!targetLine) return;
				if (targetLine.endTimeLink) delete targetLine.endTimeLink;
			});
			return;
		}
		if (nextLine.startTime === line.endTime) return;
		editLyricLines((state) => {
			const targetLine = state.lyricLines[lineIndex + 1];
			if (!targetLine) return;
			targetLine.startTime = line.endTime;
		});
	}, [endTimeLinked, editLyricLines, line.endTime, lineIndex, store]);
	useEffect(() => {
		const linked = Boolean(line.endTimeLink);
		if (linked === endTimeLinked) return;
		setEndTimeLinked(linked);
	}, [endTimeLinked, line.endTimeLink]);

	const onToggleEndTimeLink = useCallback(
		(evt: React.MouseEvent<HTMLButtonElement>) => {
			evt.preventDefault();
			evt.stopPropagation();
			if (endTimeLinked) {
				setEndTimeLinked(false);
				originalEndTimeRef.current = null;
				originalNextStartTimeRef.current = null;
				editLyricLines((state) => {
					const targetLine = state.lyricLines[lineIndex];
					if (!targetLine) return;
					const linkInfo = targetLine.endTimeLink;
					if (!linkInfo) return;
					if (
						typeof linkInfo.originalEndTime !== "number" ||
						!Number.isFinite(linkInfo.originalEndTime)
					) {
						delete targetLine.endTimeLink;
						return;
					}
					targetLine.endTime = linkInfo.originalEndTime;
					const nextTarget = state.lyricLines[lineIndex + 1];
					if (
						nextTarget &&
						Number.isFinite(linkInfo.originalNextStartTime ?? Number.NaN)
					) {
						nextTarget.startTime =
							linkInfo.originalNextStartTime ?? nextTarget.startTime;
					}
					delete targetLine.endTimeLink;
				});
				return;
			}
			const nextLine = store.get(lyricLinesAtom).lyricLines[lineIndex + 1];
			if (!nextLine) return;
			originalEndTimeRef.current = line.endTime;
			originalNextStartTimeRef.current = nextLine?.startTime ?? null;
			editLyricLines((state) => {
				const targetLine = state.lyricLines[lineIndex];
				if (!targetLine) return;
				const nextTarget = state.lyricLines[lineIndex + 1];
				if (!nextTarget) return;
				const originalEndTime =
					targetLine.endTimeLink?.originalEndTime ?? targetLine.endTime;
				const originalNextStartTime =
					targetLine.endTimeLink?.originalNextStartTime ??
					nextTarget.startTime ??
					null;
				const desiredEndTime = nextTarget.startTime ?? targetLine.endTime;
				targetLine.endTimeLink = {
					originalEndTime,
					originalNextStartTime,
				};
				targetLine.endTime = desiredEndTime;
				nextTarget.startTime = desiredEndTime;
			});
			setEndTimeLinked(true);
		},
		[editLyricLines, endTimeLinked, line.endTime, lineIndex, store],
	);

	return { endTimeLinked, onToggleEndTimeLink };
}
