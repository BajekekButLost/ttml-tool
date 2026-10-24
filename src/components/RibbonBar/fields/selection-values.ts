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

import { produce } from "immer";
import type { LyricLine, LyricWord } from "$/types/ttml";

export const MULTIPLE_VALUES = Symbol("multiple-values");

export function getSelectedFieldValue<
	L extends LyricLine | LyricWord,
	F extends keyof L,
	R = L[F],
>(
	lines: LyricLine[],
	selectedItems: ReadonlySet<string>,
	isWordField: boolean | undefined,
	fieldName: F,
	formatter: (value: L[F]) => R,
): R | typeof MULTIPLE_VALUES | undefined {
	if (selectedItems.size === 0) return undefined;
	const values = new Set<L[F]>();
	for (const line of lines) {
		if (isWordField) {
			for (const word of line.words) {
				if (selectedItems.has(word.id)) values.add((word as L)[fieldName]);
			}
		} else if (selectedItems.has(line.id)) {
			values.add((line as L)[fieldName]);
		}
	}
	if (values.size === 1) return formatter(values.values().next().value as L[F]);
	return MULTIPLE_VALUES;
}

export function getSelectedDuration(
	lines: LyricLine[],
	selectedItems: ReadonlySet<string>,
	isWordField: boolean | undefined,
) {
	if (selectedItems.size === 0) return undefined;
	const durations = new Set<number>();
	for (const line of lines) {
		if (isWordField) {
			for (const word of line.words) {
				if (selectedItems.has(word.id))
					durations.add(word.endTime - word.startTime);
			}
		} else if (selectedItems.has(line.id)) {
			durations.add(line.endTime - line.startTime);
		}
	}
	if (durations.size === 1) return durations.values().next().value;
	return MULTIPLE_VALUES;
}

export function selectionHasTimingError(
	lines: LyricLine[],
	selectedItems: ReadonlySet<string>,
	isWordField: boolean | undefined,
) {
	for (const line of lines) {
		if (isWordField) {
			for (const word of line.words) {
				if (selectedItems.has(word.id) && word.startTime > word.endTime)
					return true;
			}
		} else if (selectedItems.has(line.id) && line.startTime > line.endTime)
			return true;
	}
	return false;
}

export function applySelectedField<
	L extends LyricLine | LyricWord,
	F extends keyof L,
>(
	lines: LyricLine[],
	selectedItems: ReadonlySet<string>,
	isWordField: boolean | undefined,
	fieldName: F,
	value: L[F],
): LyricLine[] {
	return produce(lines, (draft) => {
		for (const line of draft) {
			if (isWordField) {
				for (const word of line.words) {
					if (selectedItems.has(word.id)) (word as L)[fieldName] = value;
				}
			} else if (selectedItems.has(line.id)) {
				(line as L)[fieldName] = value;
			}
		}
	});
}

export function applySelectedDuration(
	lines: LyricLine[],
	selectedItems: ReadonlySet<string>,
	isWordField: boolean | undefined,
	parsedValue: number,
	isDelta: boolean,
): LyricLine[] {
	return produce(lines, (draft) => {
		for (const line of draft) {
			if (isWordField) {
				const updates = new Map<
					string,
					{ startTime?: number; endTime?: number }
				>();

				// First pass: Calculate all new end times for selected words
				for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
					const word = line.words[wordIndex];
					if (!selectedItems.has(word.id)) continue;

					const nextWord = line.words[wordIndex + 1];
					const nextStartTime = nextWord?.startTime;
					const originalEndTime = word.endTime;

					// Calculate new end time
					const newEndTimeRaw = isDelta
						? word.endTime + parsedValue
						: word.startTime + parsedValue;
					const newEndTime = Math.max(word.startTime, newEndTimeRaw);

					// Store the update for the current word
					const wordUpdate = updates.get(word.id) || {};
					wordUpdate.endTime = newEndTime;
					updates.set(word.id, wordUpdate);

					// If it was synchronized, store the start time update for the next word
					if (isDelta && nextWord && originalEndTime === nextStartTime) {
						// We only move nextWord's startTime if the new end time doesn't exceed its original end time
						// to avoid inverting its duration (unless it's also selected, handled below)
						const nextWordOriginalEndTime = nextWord.endTime;
						if (
							newEndTime <= nextWordOriginalEndTime ||
							selectedItems.has(nextWord.id)
						) {
							const nextUpdate = updates.get(nextWord.id) || {};
							nextUpdate.startTime = newEndTime;
							// Don't auto-fix nextWord.endTime here, let the second pass or its own delta fix it
							updates.set(nextWord.id, nextUpdate);
						}
					}
				}

				// Second pass: Apply updates and ensure durations are valid
				for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
					const word = line.words[wordIndex];
					const update = updates.get(word.id);

					if (update) {
						if (update.startTime !== undefined) {
							word.startTime = update.startTime;
						}
						if (update.endTime !== undefined) {
							word.endTime = update.endTime;
						}
						// Ensure valid duration after applying updates
						if (word.endTime < word.startTime) {
							word.endTime = word.startTime;
						}
					}
				}
			} else if (selectedItems.has(line.id)) {
				const newEndTimeRaw = isDelta
					? line.endTime + parsedValue
					: line.startTime + parsedValue;
				line.endTime = Math.max(line.startTime, newEndTimeRaw);
			}
		}
	});
}
