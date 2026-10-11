import { describe, expect, it } from "vitest";
import { type LyricSection, newLyricLine, newLyricWord } from "$/types/ttml";
import {
	getCategoryColor,
	getHeaderType,
	hasTimingError,
} from "./line-presentation";

describe("line presentation", () => {
	it("uses the section category ahead of the legacy header", () => {
		const section: LyricSection = {
			id: "section",
			category: "bridge",
			label: "[Verse 2]",
		};
		expect(getHeaderType("[Verse 2]", section)).toBe("bridge");
	});

	it("recognizes existing header spellings without changing fallback behavior", () => {
		expect(getHeaderType("[CHORUS 2]", undefined)).toBe("chorus");
		expect(getHeaderType("[Strofa]", undefined)).toBe("strofa");
		expect(getHeaderType(undefined, undefined)).toBe("accent");
		expect(getHeaderType("[Unknown]", undefined)).toBe("accent");
	});

	it("preserves color matching and its existing precedence", () => {
		for (const category of ["chorus", "refren", "refrain", "post-chorus"]) {
			expect(getCategoryColor(category)).toBe("pink");
		}
		for (const category of ["verse", "strofa", "couplet"]) {
			expect(getCategoryColor(category)).toBe("blue");
		}
		expect(getCategoryColor("bridge")).toBe("orange");
		expect(getCategoryColor("hook")).toBe("purple");
		expect(getCategoryColor("instrumental")).toBe("green");
		expect(getCategoryColor("interlude")).toBe("gray");
		expect(getCategoryColor("unknown")).toBe("accent");
	});

	it("flags inverted line and word times, but accepts equal and untimed times", () => {
		const line = newLyricLine();
		expect(hasTimingError(line)).toBe(false);
		expect(hasTimingError({ ...line, startTime: 200, endTime: 100 })).toBe(
			true,
		);
		expect(
			hasTimingError({
				...line,
				words: [{ ...newLyricWord(), startTime: 200, endTime: 100 }],
			}),
		).toBe(true);
		expect(hasTimingError({ ...line, startTime: 100, endTime: 100 })).toBe(
			false,
		);
	});
});
