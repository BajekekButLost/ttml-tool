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

import type { Draft } from "immer";
import type { useStore } from "jotai";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { currentTimeAtom } from "$/modules/audio/states/index.ts";
import type { LyricLine, TTMLLyric } from "$/types/ttml.ts";
import styles from "../index.module.css";
import { useSyncWordEditing } from "./use-sync-word-editing";

export const useSyncWordLifecycle = ({
	store,
	startTime,
	endTime,
	highlightActiveWord,
	enableSyncGlowAnimation,
	visualizeTimestampUpdate,
	editLyricLines,
	line,
	wordIndex,
}: {
	store: ReturnType<typeof useStore>;
	startTime: number;
	endTime: number;
	highlightActiveWord: boolean;
	enableSyncGlowAnimation: boolean;
	visualizeTimestampUpdate: boolean;
	editLyricLines: (recipe: (state: Draft<TTMLLyric>) => void) => void;
	line: LyricLine;
	wordIndex: number;
}) => {
	const startTimeRef = useRef<HTMLDivElement>(null);
	const endTimeRef = useRef<HTMLDivElement>(null);
	const wordContainerRef = useRef<HTMLDivElement>(null);
	const lastClickTimeRef = useRef(0);

	// Keep mutable refs for active-highlight settings to avoid re-subscribing on every settings change
	const highlightActiveWordRef = useRef(highlightActiveWord);
	const enableSyncGlowAnimationRef = useRef(enableSyncGlowAnimation);

	const updateActive = useCallback(() => {
		const el = wordContainerRef.current;
		if (!el) return;
		const currentTime = store.get(currentTimeAtom);
		const isActive = currentTime >= startTime && currentTime < endTime;
		if (isActive && highlightActiveWordRef.current) {
			el.classList.add(styles.active);
			if (enableSyncGlowAnimationRef.current) {
				el.classList.add(styles.animated);
			} else {
				el.classList.remove(styles.animated);
			}
		} else {
			el.classList.remove(styles.active);
			el.classList.remove(styles.animated);
		}
	}, [store, startTime, endTime]);

	useEffect(() => {
		highlightActiveWordRef.current = highlightActiveWord;
		updateActive();
	}, [highlightActiveWord, updateActive]);

	useEffect(() => {
		enableSyncGlowAnimationRef.current = enableSyncGlowAnimation;
		updateActive();
	}, [enableSyncGlowAnimation, updateActive]);

	// Re-apply active/animated classes synchronously on every React reconciliation
	// pass so React updating className on the DOM element does not wipe out imperative classes.
	useLayoutEffect(() => {
		updateActive();
	});

	// Drive the active/animated classes imperatively via store.sub
	// instead of subscribing to currentTimeAtom inside React (which causes ~60fps
	// re-renders of every visible word).
	useEffect(() => {
		updateActive();
		return store.sub(currentTimeAtom, updateActive);
	}, [store, updateActive]);

	// Keep editing hooks between active highlighting and timestamp effects, as in the original component.
	const editing = useSyncWordEditing({
		editLyricLines,
		line,
		wordIndex,
	});

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
	}, [startTime, visualizeTimestampUpdate]);

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
	}, [endTime, visualizeTimestampUpdate]);
	return {
		startTimeRef,
		endTimeRef,
		wordContainerRef,
		lastClickTimeRef,
		editing,
	};
};
