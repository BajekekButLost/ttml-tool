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

import type { LyricLine, LyricSection } from "$/types/ttml.ts";

export function getHeaderType(
	activeGeniusHeader: string | undefined,
	activeSection: LyricSection | undefined,
) {
	if (activeSection) return activeSection.category;
	if (!activeGeniusHeader) return "accent";
	const match = activeGeniusHeader.match(
		/^\[(Chorus|Verse|Bridge|Intro|Outro|Pre-Chorus|Hook|Strofa|Refren|Skit|Interlude|Instrumental|Pre-Refren|Partea|Slofa|Section|Part|S\d+|V\d+|C\d+|Strophe|Refrain|Pont|Couplet|Refrain|Break).*?\]$/i,
	);
	return match ? match[1].toLowerCase() : "accent";
}

export function getCategoryColor(
	headerType: string,
): "accent" | "pink" | "blue" | "orange" | "purple" | "green" | "gray" {
	if (!headerType) return "accent";
	// Before the chorus check, which would otherwise also match "post-chorus".
	if (headerType.includes("hook") || headerType.includes("post-chorus"))
		return "purple";
	if (
		headerType.includes("chorus") ||
		headerType.includes("refren") ||
		headerType.includes("refrain")
	)
		return "pink";
	if (
		headerType.includes("verse") ||
		headerType.includes("strofa") ||
		headerType.includes("couplet")
	)
		return "blue";
	if (headerType.includes("bridge") || headerType.includes("break"))
		return "orange";
	if (headerType.includes("solo") || headerType.includes("instrumental"))
		return "green";
	if (
		headerType.includes("intro") ||
		headerType.includes("outro") ||
		headerType.includes("skit") ||
		headerType.includes("interlude")
	)
		return "gray";
	return "accent";
}

export function hasTimingError(
	line: Pick<LyricLine, "startTime" | "endTime" | "words">,
) {
	if (line.startTime > line.endTime) {
		return true;
	}
	for (const word of line.words) {
		if (word.startTime > word.endTime) {
			return true;
		}
	}
	return false;
}
