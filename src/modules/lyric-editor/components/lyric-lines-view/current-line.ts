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

import type { LyricLine } from "$/types/ttml.ts";

export const findCurrentLineIndex = (
	lines: LyricLine[],
	currentTime: number,
	focusMainLine: boolean = true,
) => {
	const activeMainIndex = lines.findIndex(
		(line) =>
			!line.isBG &&
			line.endTime > line.startTime &&
			currentTime >= line.startTime &&
			currentTime <= line.endTime,
	);
	const activeBGIndex = lines.findIndex(
		(line) =>
			line.isBG &&
			line.endTime > line.startTime &&
			currentTime >= line.startTime &&
			currentTime <= line.endTime,
	);

	if (focusMainLine) {
		// If a v1 (main) vocal is ongoing, DISREGARD background lyrics and focus on the main line
		if (activeMainIndex !== -1) {
			return activeMainIndex;
		}
		// If no main vocal is ongoing, scroll to background lyric if active
		if (activeBGIndex !== -1) {
			return activeBGIndex;
		}
	} else {
		if (activeMainIndex !== -1) return activeMainIndex;
		if (activeBGIndex !== -1) return activeBGIndex;
	}

	let previousIndex = -1;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.endTime <= line.startTime) continue;
		if (currentTime < line.startTime) {
			return previousIndex !== -1 ? previousIndex : i;
		}
		previousIndex = i;
	}
	return previousIndex;
};
