// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { newLyricLine, newLyricWord, type TTMLLyric } from "$/types/ttml";
import { generateProjectTtmlText } from "../folder-project/lyric-io";
import { produceTTMLText, reviewTTMLExport } from "./ttml-export";

const lyric = (): TTMLLyric => ({
	metadata: [],
	lyricLines: [
		{
			...newLyricLine(),
			startTime: 100,
			endTime: 200,
			words: [
				{ ...newLyricWord(), word: "we?re", startTime: 100, endTime: 200 },
			],
		},
	],
});

describe("TTML export", () => {
	it("uses the same serializer/options for standalone and project text", () => {
		const document = lyric();
		document.lyricLines.push(
			{ ...document.lyricLines[0], id: "bg1", isBG: true },
			{ ...document.lyricLines[0], id: "bg2", isBG: true },
		);
		for (const allowConsecutiveBackgroundLines of [false, true]) {
			const options = { allowConsecutiveBackgroundLines };
			const normalization = {
				normalizeApostrophes: true,
				normalizeCyrillicEs: true,
			};
			expect(generateProjectTtmlText(document, normalization, options)).toBe(
				produceTTMLText(document, normalization, options),
			);
		}
		expect(
			produceTTMLText(document, undefined, {
				allowConsecutiveBackgroundLines: true,
			}),
		).not.toBe(
			produceTTMLText(document, undefined, {
				allowConsecutiveBackgroundLines: false,
			}),
		);
	});
	it("checks untimed ruby rather than the timed parent and selects the ruby id", () => {
		const document = lyric();
		document.lyricLines[0].words[0].ruby = [
			{ word: "reading", startTime: 0, endTime: 0 },
		];
		const untimed = reviewTTMLExport(document).untimed;
		expect(untimed?.unit.id).toBe(
			`${document.lyricLines[0].words[0].id}-ruby-0`,
		);
	});
	it("prioritizes an untimed line and ignores whitespace-only words", () => {
		const document = lyric();
		document.lyricLines[0].words.push({ ...newLyricWord(), word: " " });
		expect(reviewTTMLExport(document).untimed).toBeUndefined();
		document.lyricLines[0].endTime = 0;
		expect(reviewTTMLExport(document).untimed?.line).toBe(
			document.lyricLines[0],
		);
	});
});
