import type { LyricLine } from "$/types/ttml";
export interface LineGroup {
	main: LyricLine;
	bg: LyricLine[];
}

export function groupAMLLLines(lines: LyricLine[]): LineGroup[] {
	const sorted = [...lines].sort((a, b) => a.startTime - b.startTime);
	const groups: LineGroup[] = [];

	for (let i = 0; i < sorted.length; i++) {
		const line = sorted[i];
		if (line.isBG) {
			// Attach to the last group if one exists
			if (groups.length > 0) {
				groups[groups.length - 1].bg.push(line);
			} else {
				groups.push({ main: line, bg: [] });
			}
		} else {
			groups.push({ main: line, bg: [] });
		}
	}

	return groups;
}
