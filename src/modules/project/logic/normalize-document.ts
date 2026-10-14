import type { LyricWord, TTMLLyric } from "$/types/ttml";

type LegacyWord = LyricWord & { ruby?: unknown };

/** Drop ruby readings that older documents and autosaves may still carry. */
export function normalizeDocumentWords(lyric: TTMLLyric): TTMLLyric {
	return {
		...lyric,
		lyricLines: lyric.lyricLines.map((line) => ({
			...line,
			words: line.words.map((word) => {
				if (!("ruby" in word)) return word;
				const { ruby: _ruby, ...rest } = word as LegacyWord;
				return rest;
			}),
		})),
	};
}
